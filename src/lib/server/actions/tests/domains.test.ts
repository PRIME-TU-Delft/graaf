import { beforeEach, describe, expect, it } from 'vitest';

import prisma from '$lib/server/db/prisma';
import { DomainActions } from '$lib/server/actions/Domains';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema
} from '$lib/zod/domainSchema';

import {
	FIXTURE_GRAPHS,
	createOutsider,
	fixtureUsers,
	getDomain,
	getGraph,
	getSubject,
	seedFixture
} from './helpers/fixture';
import { buildForm, expectDenied } from './helpers/actions';

// Every method here is gated at CourseAdminEditorORProgramAdminEditor via
// whereHasGraphCoursePermission, the widest course tier. GraphThree belongs to CourseThree, so the
// fixture's course editor is authorized. The denied party has to be a user with no role anywhere.
//
// Denials are asserted by status and by the database being unchanged, not by message text, since
// withPermissionCheck currently emits a raw Prisma error rather than its message (#153).

beforeEach(seedFixture);

async function graphThreeSetup() {
	const { courseEditor } = await fixtureUsers();
	const outsider = await createOutsider();
	const graph = await getGraph(FIXTURE_GRAPHS.three);

	return { courseEditor, outsider, graph };
}

describe('DomainActions.addDomainToGraph', () => {
	it('allows a course editor', async () => {
		const { courseEditor, graph } = await graphThreeSetup();

		const form = await buildForm(domainSchema, {
			domainId: 0,
			graphId: graph.id,
			name: 'AddedDomain',
			style: ''
		});
		const result = await DomainActions.addDomainToGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.domain.findFirst({ where: { graphId: graph.id, name: 'AddedDomain' } })
		).resolves.not.toBeNull();
	});

	it('denies a user with no role on the course', async () => {
		const { outsider, graph } = await graphThreeSetup();

		const form = await buildForm(domainSchema, {
			domainId: 0,
			graphId: graph.id,
			name: 'AddedDomain',
			style: ''
		});
		const result = await DomainActions.addDomainToGraph(outsider, form);

		expectDenied(result);
		await expect(
			prisma.domain.findFirst({ where: { graphId: graph.id, name: 'AddedDomain' } })
		).resolves.toBeNull();
	});
});

describe('DomainActions.changeDomain', () => {
	it('allows a course editor', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const domain = await getDomain(graph.id, 'DomainOne');

		const form = await buildForm(domainSchema, {
			domainId: domain.id,
			graphId: graph.id,
			name: 'RenamedDomain',
			style: ''
		});
		const result = await DomainActions.changeDomain(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.domain.findUniqueOrThrow({ where: { id: domain.id } })
		).resolves.toMatchObject({ name: 'RenamedDomain' });
	});

	it('denies a user with no role and leaves the name alone', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const domain = await getDomain(graph.id, 'DomainOne');

		const form = await buildForm(domainSchema, {
			domainId: domain.id,
			graphId: graph.id,
			name: 'RenamedDomain',
			style: ''
		});
		const result = await DomainActions.changeDomain(outsider, form);

		expectDenied(result);
		await expect(
			prisma.domain.findUniqueOrThrow({ where: { id: domain.id } })
		).resolves.toMatchObject({ name: 'DomainOne' });
	});
});

describe('DomainActions.deleteDomain', () => {
	// Batch method. The per-id relation and subject cleanup queries carry no permission clause of
	// their own; only the final graph.update is gated, with the surrounding $transaction as the
	// sole thing preventing a denied caller from still detaching relations.

	async function deleteDomainTwoForm(graphId: number) {
		const domainOne = await getDomain(graphId, 'DomainOne');
		const domainTwo = await getDomain(graphId, 'DomainTwo');
		const domainThree = await getDomain(graphId, 'DomainThree');
		const subjectThree = await getSubject(graphId, 'SubjectThree');

		const form = await buildForm(deleteDomainSchema, {
			graphId,
			domainId: domainTwo.id,
			sourceDomains: [domainOne.id],
			targetDomains: [domainThree.id],
			connectedSubjects: [subjectThree.id]
		});

		return { form, domainOne, domainTwo, domainThree, subjectThree };
	}

	it('allows a course editor, removing the domain and its relations', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const { form, domainTwo, subjectThree } = await deleteDomainTwoForm(graph.id);

		const result = await DomainActions.deleteDomain(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.domain.findUnique({ where: { id: domainTwo.id } })).resolves.toBeNull();
		await expect(
			prisma.subject.findUniqueOrThrow({ where: { id: subjectThree.id } })
		).resolves.toMatchObject({ domainId: null });
	});

	it('denies a user with no role, rolling back the ungated cleanup queries', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const { form, domainOne, domainTwo, domainThree, subjectThree } = await deleteDomainTwoForm(
			graph.id
		);

		const result = await DomainActions.deleteDomain(outsider, form);

		expectDenied(result);

		// The domain survives, and so does every relation the ungated cleanup would have severed.
		await expect(prisma.domain.findUnique({ where: { id: domainTwo.id } })).resolves.not.toBeNull();

		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainTwo.id },
			include: { sourceDomains: true, targetDomains: true }
		});
		expect(after.sourceDomains.map((d) => d.id)).toEqual([domainOne.id]);
		expect(after.targetDomains.map((d) => d.id)).toEqual([domainThree.id]);

		await expect(
			prisma.subject.findUniqueOrThrow({ where: { id: subjectThree.id } })
		).resolves.toMatchObject({ domainId: domainTwo.id });
	});
});

describe('DomainActions.addDomainRel', () => {
	it('allows a course editor', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainThree = await getDomain(graph.id, 'DomainThree');

		const form = await buildForm(domainRelSchema, {
			graphId: graph.id,
			sourceDomainId: domainOne.id,
			targetDomainId: domainThree.id
		});
		const result = await DomainActions.addDomainRel(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainOne.id },
			include: { targetDomains: true }
		});
		expect(after.targetDomains.map((d) => d.id)).toContain(domainThree.id);
	});

	it('denies a user with no role and creates no relation', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainThree = await getDomain(graph.id, 'DomainThree');

		const form = await buildForm(domainRelSchema, {
			graphId: graph.id,
			sourceDomainId: domainOne.id,
			targetDomainId: domainThree.id
		});
		const result = await DomainActions.addDomainRel(outsider, form);

		expectDenied(result);
		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainOne.id },
			include: { targetDomains: true }
		});
		expect(after.targetDomains.map((d) => d.id)).not.toContain(domainThree.id);
	});
});

describe('DomainActions.deleteDomainRel', () => {
	// Hand-rolled try/catch rather than withPermissionCheck, and returns undefined on success.

	it('allows a course editor, returning undefined', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainTwo = await getDomain(graph.id, 'DomainTwo');

		const form = await buildForm(domainRelSchema, {
			graphId: graph.id,
			sourceDomainId: domainOne.id,
			targetDomainId: domainTwo.id
		});
		const result = await DomainActions.deleteDomainRel(courseEditor, form);

		expect(result).toBeUndefined();
		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainOne.id },
			include: { targetDomains: true }
		});
		expect(after.targetDomains).toHaveLength(0);
	});

	it('denies a user with no role and keeps the relation', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainTwo = await getDomain(graph.id, 'DomainTwo');

		const form = await buildForm(domainRelSchema, {
			graphId: graph.id,
			sourceDomainId: domainOne.id,
			targetDomainId: domainTwo.id
		});
		const result = await DomainActions.deleteDomainRel(outsider, form);

		expectDenied(result);
		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainOne.id },
			include: { targetDomains: true }
		});
		expect(after.targetDomains.map((d) => d.id)).toEqual([domainTwo.id]);
	});
});

describe('DomainActions.changeDomainRel', () => {
	it('allows a course editor to move a relation', async () => {
		const { courseEditor, graph } = await graphThreeSetup();
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainTwo = await getDomain(graph.id, 'DomainTwo');
		const domainThree = await getDomain(graph.id, 'DomainThree');

		const form = await buildForm(changeDomainRelSchema, {
			graphId: graph.id,
			oldSourceDomainId: domainOne.id,
			oldTargetDomainId: domainTwo.id,
			sourceDomainId: domainOne.id,
			targetDomainId: domainThree.id
		});
		const result = await DomainActions.changeDomainRel(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainOne.id },
			include: { targetDomains: true }
		});
		expect(after.targetDomains.map((d) => d.id)).toEqual([domainThree.id]);
	});

	it('denies a user with no role and leaves the original relation intact', async () => {
		const { outsider, graph } = await graphThreeSetup();
		const domainOne = await getDomain(graph.id, 'DomainOne');
		const domainTwo = await getDomain(graph.id, 'DomainTwo');
		const domainThree = await getDomain(graph.id, 'DomainThree');

		const form = await buildForm(changeDomainRelSchema, {
			graphId: graph.id,
			oldSourceDomainId: domainOne.id,
			oldTargetDomainId: domainTwo.id,
			sourceDomainId: domainOne.id,
			targetDomainId: domainThree.id
		});
		const result = await DomainActions.changeDomainRel(outsider, form);

		expectDenied(result);
		const after = await prisma.domain.findUniqueOrThrow({
			where: { id: domainOne.id },
			include: { targetDomains: true }
		});
		expect(after.targetDomains.map((d) => d.id)).toEqual([domainTwo.id]);
	});
});
