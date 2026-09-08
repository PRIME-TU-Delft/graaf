import { beforeEach, describe, expect, it } from 'vitest';

import prisma from '$lib/server/db/prisma';
import { SubjectActions } from '$lib/server/actions/Subjects';
import {
	changeSubjectRelSchema,
	deleteSubjectSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/zod/subjectSchema';

import {
	FIXTURE_GRAPHS,
	createOutsider,
	fixtureUsers,
	getDomain,
	getGraph,
	getSubject,
	seedFixture
} from './helpers/fixture';
import { buildForm, errorMessages, expectDenied } from './helpers/actions';

// Same gate as domains: CourseAdminEditorORProgramAdminEditor via whereHasGraphCoursePermission.
// GraphThree belongs to CourseThree, so the fixture course editor is authorized and a user with no
// role anywhere is the denied party.
//
// Denials now assert the entity-specific message too, now that withGuardedMutation correctly
// matches Prisma 7's P2025 shape (#153). deleteSubjectRel is the exception: it hand-rolls its own
// try/catch instead of going through withGuardedMutation, so it still surfaces the raw Prisma
// error message and stays status-only.

beforeEach(seedFixture);

async function graphThreeSetup() {
	const { courseEditor } = await fixtureUsers();
	const outsider = await createOutsider();
	const graph = await getGraph(FIXTURE_GRAPHS.three);

	return { courseEditor, outsider, graph };
}

describe('SubjectActions.addSubjectToGraph', () => {
	it('allows a course editor', async () => {
		const { courseEditor, graph } = await graphThreeSetup();

		const form = await buildForm(subjectSchema, {
			subjectId: 0,
			graphId: graph.id,
			name: 'AddedSubject',
			domainId: 0
		});
		const result = await SubjectActions.addSubjectToGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.subject.findFirst({ where: { graphId: graph.id, name: 'AddedSubject' } })
		).resolves.not.toBeNull();
	});

	it('denies a user with no role on the course', async () => {
		const { outsider, graph } = await graphThreeSetup();

		const form = await buildForm(subjectSchema, {
			subjectId: 0,
			graphId: graph.id,
			name: 'AddedSubject',
			domainId: 0
		});
		const result = await SubjectActions.addSubjectToGraph(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this subject");
		await expect(
			prisma.subject.findFirst({ where: { graphId: graph.id, name: 'AddedSubject' } })
		).resolves.toBeNull();
	});
});

describe('SubjectActions.changeSubject', () => {
	it('allows a course editor to rename and reassign the domain', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const subject = await getSubject(graph.id, 'SubjectOne');
		const domainTwo = await getDomain(graph.id, 'DomainTwo');

		const form = await buildForm(subjectSchema, {
			subjectId: subject.id,
			graphId: graph.id,
			name: 'RenamedSubject',
			domainId: domainTwo.id
		});
		const result = await SubjectActions.changeSubject(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.subject.findUniqueOrThrow({ where: { id: subject.id } })
		).resolves.toMatchObject({ name: 'RenamedSubject', domainId: domainTwo.id });
	});

	it('denies a user with no role and changes nothing', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const subject = await getSubject(graph.id, 'SubjectOne');
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainTwo = await getDomain(graph.id, 'DomainTwo');

		const form = await buildForm(subjectSchema, {
			subjectId: subject.id,
			graphId: graph.id,
			name: 'RenamedSubject',
			domainId: domainTwo.id
		});
		const result = await SubjectActions.changeSubject(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this subject");
		await expect(
			prisma.subject.findUniqueOrThrow({ where: { id: subject.id } })
		).resolves.toMatchObject({ name: 'SubjectOne', domainId: domainOne.id });
	});
});

describe('SubjectActions.deleteSubject', () => {
	// Batch method. As with deleteDomain, the per-id relation cleanup carries no permission clause;
	// only the final graph.update is gated, with the $transaction as the sole rollback guarantee.

	async function deleteSubjectTwoForm(graphId: number) {
		const subjectOne = await getSubject(graphId, 'SubjectOne');
		const subjectTwo = await getSubject(graphId, 'SubjectTwo');
		const subjectThree = await getSubject(graphId, 'SubjectThree');

		const form = await buildForm(deleteSubjectSchema, {
			graphId,
			subjectId: subjectTwo.id,
			sourceSubjects: [subjectThree.id],
			targetSubjects: [subjectOne.id]
		});

		return { form, subjectOne, subjectTwo, subjectThree };
	}

	it('allows a course editor, removing the subject', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const { form, subjectTwo } = await deleteSubjectTwoForm(graph.id);

		const result = await SubjectActions.deleteSubject(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.subject.findUnique({ where: { id: subjectTwo.id } })).resolves.toBeNull();
	});

	it('denies a user with no role, rolling back the ungated relation cleanup', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const { form, subjectOne, subjectTwo, subjectThree } = await deleteSubjectTwoForm(graph.id);

		const result = await SubjectActions.deleteSubject(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to delete this subject");
		await expect(
			prisma.subject.findUnique({ where: { id: subjectTwo.id } })
		).resolves.not.toBeNull();

		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectTwo.id },
			include: { sourceSubjects: true, targetSubjects: true }
		});
		expect(after.sourceSubjects.map((s) => s.id)).toEqual([subjectThree.id]);
		expect(after.targetSubjects.map((s) => s.id)).toEqual([subjectOne.id]);
	});
});

describe('SubjectActions.addSubjectRel', () => {
	it('allows a course editor', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectThree = await getSubject(graph.id, 'SubjectThree');

		const form = await buildForm(subjectRelSchema, {
			graphId: graph.id,
			sourceSubjectId: subjectThree.id,
			targetSubjectId: subjectOne.id
		});
		const result = await SubjectActions.addSubjectRel(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectThree.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).toContain(subjectOne.id);
	});

	it('denies a user with no role and creates no relation', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectThree = await getSubject(graph.id, 'SubjectThree');

		const form = await buildForm(subjectRelSchema, {
			graphId: graph.id,
			sourceSubjectId: subjectThree.id,
			targetSubjectId: subjectOne.id
		});
		const result = await SubjectActions.addSubjectRel(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain(
			"You don't have permission to edit this subject relation"
		);
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectThree.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).not.toContain(subjectOne.id);
	});

	it('rejects a self relation at the schema level, creating nothing', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');

		const form = await buildForm(subjectRelSchema, {
			graphId: graph.id,
			sourceSubjectId: subjectOne.id,
			targetSubjectId: subjectOne.id
		});
		// The refine's two-field path nests the message under errors.sourceSubjectId.targetSubjectId,
		// same shape domainRelSchema's refine produces, which errorMessages() can't flatten.
		expect(form.errors).toMatchObject({
			sourceSubjectId: {
				targetSubjectId: ['sourceSubjectId and targetSubjectId must not be the same']
			}
		});

		const result = await SubjectActions.addSubjectRel(courseEditor, form);

		expectDenied(result);
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectOne.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).not.toContain(subjectOne.id);
	});

	it('rejects a self relation at the action layer even if a caller bypasses the zod schema', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');

		const form = await buildForm(subjectRelSchema, {
			graphId: graph.id,
			sourceSubjectId: subjectOne.id,
			targetSubjectId: subjectOne.id
		});
		// Simulates a caller that writes through Prisma directly and skips zod, e.g. the migration.
		form.valid = true;
		const result = await SubjectActions.addSubjectRel(courseEditor, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain('A subject cannot be connected to itself');
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectOne.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).not.toContain(subjectOne.id);
	});
});

describe('SubjectActions.deleteSubjectRel', () => {
	// Hand-rolled try/catch rather than withGuardedMutation, returns undefined on success.

	it('allows a course editor, returning undefined', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const subjectThree = await getSubject(graph.id, 'SubjectThree');

		const form = await buildForm(subjectRelSchema, {
			graphId: graph.id,
			sourceSubjectId: subjectThree.id,
			targetSubjectId: subjectTwo.id
		});
		const result = await SubjectActions.deleteSubjectRel(courseEditor, form);

		expect(result).toBeUndefined();
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectThree.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects).toHaveLength(0);
	});

	it('denies a user with no role and keeps the relation', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const subjectThree = await getSubject(graph.id, 'SubjectThree');

		const form = await buildForm(subjectRelSchema, {
			graphId: graph.id,
			sourceSubjectId: subjectThree.id,
			targetSubjectId: subjectTwo.id
		});
		const result = await SubjectActions.deleteSubjectRel(outsider, form);

		expectDenied(result);
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectThree.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).toEqual([subjectTwo.id]);
	});
});

describe('SubjectActions.changeSubjectRel', () => {
	it('allows a course editor to move a relation', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const subjectThree = await getSubject(graph.id, 'SubjectThree');

		const form = await buildForm(changeSubjectRelSchema, {
			graphId: graph.id,
			oldSourceSubjectId: subjectThree.id,
			oldTargetSubjectId: subjectTwo.id,
			sourceSubjectId: subjectThree.id,
			targetSubjectId: subjectOne.id
		});
		const result = await SubjectActions.changeSubjectRel(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectThree.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).toEqual([subjectOne.id]);
	});

	it('denies a user with no role and leaves the original relation intact', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const subjectThree = await getSubject(graph.id, 'SubjectThree');

		const form = await buildForm(changeSubjectRelSchema, {
			graphId: graph.id,
			oldSourceSubjectId: subjectThree.id,
			oldTargetSubjectId: subjectTwo.id,
			sourceSubjectId: subjectThree.id,
			targetSubjectId: subjectOne.id
		});
		const result = await SubjectActions.changeSubjectRel(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain(
			"You don't have permission to edit this subject relation"
		);
		const after = await prisma.subject.findUniqueOrThrow({
			where: { id: subjectThree.id },
			include: { targetSubjects: true }
		});
		expect(after.targetSubjects.map((s) => s.id)).toEqual([subjectTwo.id]);
	});
});
