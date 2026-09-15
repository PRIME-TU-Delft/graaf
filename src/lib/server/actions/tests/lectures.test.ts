import { beforeEach, describe, expect, it } from 'vitest';

import prisma from '$lib/server/db/prisma';
import { LectureActions } from '$lib/server/actions/Lectures';
import { deleteLectureSchema, lectureSchema } from '$lib/zod/lectureSchema';

import {
	FIXTURE_GRAPHS,
	createLecture,
	createOutsider,
	fixtureUsers,
	getGraph,
	getSubject,
	seedFixture
} from './helpers/fixture';
import { buildForm, errorMessages, expectDenied } from './helpers/actions';

// This class is the one place where the tier is not uniform across a single aggregate:
//
//   addLectureToGraph    CourseAdminEditorORProgramAdminEditor  (course editors included)
//   changeLectureName    CourseAdminORProgramAdminEditor        (course editors excluded)
//   linkSubjectsToLecture CourseAdminORProgramAdminEditor       (course editors excluded)
//   deleteLecture        CourseAdminORProgramAdminEditor        (course editors excluded)
//
// So a course editor may add a lecture and then be unable to rename, refill, or remove it. The
// describe block at the bottom pins that split down explicitly.
//
// Denials assert the entity-specific message now that withGuardedMutation correctly matches
// Prisma 7's P2025 shape instead of falling through to a raw Prisma error (#153).
// linkSubjectsToLecture is the one exception: it still goes through a $transaction lookup whose
// P2025 doesn't carry meta.modelName, so its denials stay status-only until #154 is fixed.

beforeEach(seedFixture);

/** CourseTwo/GraphTwo, where the fixture course admin holds rights. */
async function adminGraph() {
	const { courseAdmin } = await fixtureUsers();
	const graph = await getGraph(FIXTURE_GRAPHS.two);

	return { courseAdmin, graph };
}

/** CourseThree/GraphThree, where the fixture course editor holds rights. */
async function editorGraph() {
	const { courseEditor } = await fixtureUsers();
	const graph = await getGraph(FIXTURE_GRAPHS.three);

	return { courseEditor, graph };
}

describe('LectureActions.addLectureToGraph', () => {
	it('allows a course editor, the widest tier in this class', async () => {
		const { courseEditor, graph } = await editorGraph();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: 0,
			name: 'AddedLecture',
			subjectIds: [subjectOne.id]
		});
		const result = await LectureActions.addLectureToGraph(courseEditor, form);

		expect(result).not.toHaveProperty('status');
		const created = await prisma.lecture.findFirst({
			where: { graphId: graph.id, name: 'AddedLecture' },
			include: { subjects: true }
		});
		expect(created?.subjects.map((s) => s.id)).toEqual([subjectOne.id]);
	});

	it('denies a user with no role on the course', async () => {
		const outsider = await createOutsider();
		const graph = await getGraph(FIXTURE_GRAPHS.three);
		const subjectOne = await getSubject(graph.id, 'SubjectOne');

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: 0,
			name: 'AddedLecture',
			subjectIds: [subjectOne.id]
		});
		const result = await LectureActions.addLectureToGraph(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this lecture");
		await expect(
			prisma.lecture.findFirst({ where: { graphId: graph.id, name: 'AddedLecture' } })
		).resolves.toBeNull();
	});
});

describe('LectureActions.changeLectureName', () => {
	it('allows a course admin', async () => {
		const { courseAdmin, graph } = await adminGraph();
		const lecture = await createLecture(graph.id);

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id,
			name: 'RenamedLecture',
			subjectIds: []
		});
		const result = await LectureActions.changeLectureName(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.lecture.findUniqueOrThrow({ where: { id: lecture.id } })
		).resolves.toMatchObject({ name: 'RenamedLecture' });
	});

	it('denies a user with no role and keeps the name', async () => {
		const outsider = await createOutsider();
		const graph = await getGraph(FIXTURE_GRAPHS.three);
		const lecture = await createLecture(graph.id);

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id,
			name: 'RenamedLecture',
			subjectIds: []
		});
		const result = await LectureActions.changeLectureName(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this lecture");
		await expect(
			prisma.lecture.findUniqueOrThrow({ where: { id: lecture.id } })
		).resolves.toMatchObject({ name: 'Lecture' });
	});
});

describe('LectureActions.linkSubjectsToLecture', () => {
	// Batch method: subjectIds replaces the whole set, and no individual id is permission checked.

	it('allows a course admin to replace the subject set', async () => {
		const { courseAdmin, graph } = await adminGraph();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const lecture = await createLecture(graph.id, [subjectOne.id]);

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id,
			name: lecture.name,
			subjectIds: [subjectTwo.id]
		});
		const result = await LectureActions.linkSubjectsToLecture(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.lecture.findUniqueOrThrow({
			where: { id: lecture.id },
			include: { subjects: true }
		});
		expect(after.subjects.map((s) => s.id)).toEqual([subjectTwo.id]);
	});

	it('denies a user with no role and leaves the original subject set', async () => {
		const outsider = await createOutsider();
		const graph = await getGraph(FIXTURE_GRAPHS.three);
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const lecture = await createLecture(graph.id, [subjectOne.id]);

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id,
			name: lecture.name,
			subjectIds: [subjectTwo.id]
		});
		const result = await LectureActions.linkSubjectsToLecture(outsider, form);

		// #154: this used to write its error to a form path setError could not reach ('subjectIds._errors'
		// on a non-array schema field), so the denial carried no message. It now writes to '' like the
		// rest of this class.
		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this lecture");
		const after = await prisma.lecture.findUniqueOrThrow({
			where: { id: lecture.id },
			include: { subjects: true }
		});
		expect(after.subjects.map((s) => s.id)).toEqual([subjectOne.id]);
	});
});

describe('LectureActions.deleteLecture', () => {
	it('allows a course admin', async () => {
		const { courseAdmin, graph } = await adminGraph();
		const lecture = await createLecture(graph.id);

		const form = await buildForm(deleteLectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id
		});
		const result = await LectureActions.deleteLecture(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.lecture.findUnique({ where: { id: lecture.id } })).resolves.toBeNull();
	});

	it('denies a user with no role and keeps the lecture', async () => {
		const outsider = await createOutsider();
		const graph = await getGraph(FIXTURE_GRAPHS.three);
		const lecture = await createLecture(graph.id);

		const form = await buildForm(deleteLectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id
		});
		const result = await LectureActions.deleteLecture(outsider, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to delete this lecture");
		await expect(prisma.lecture.findUnique({ where: { id: lecture.id } })).resolves.not.toBeNull();
	});
});

describe('course editor tier split', () => {
	// A course editor is inside the gate for adding a lecture and outside it for everything else.

	it('lets a course editor add a lecture but not rename it', async () => {
		const { courseEditor, graph } = await editorGraph();
		const lecture = await createLecture(graph.id);

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id,
			name: 'RenamedLecture',
			subjectIds: []
		});
		const result = await LectureActions.changeLectureName(courseEditor, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this lecture");
		await expect(
			prisma.lecture.findUniqueOrThrow({ where: { id: lecture.id } })
		).resolves.toMatchObject({ name: 'Lecture' });
	});

	it('does not let a course editor relink subjects', async () => {
		const { courseEditor, graph } = await editorGraph();
		const subjectOne = await getSubject(graph.id, 'SubjectOne');
		const subjectTwo = await getSubject(graph.id, 'SubjectTwo');
		const lecture = await createLecture(graph.id, [subjectOne.id]);

		const form = await buildForm(lectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id,
			name: lecture.name,
			subjectIds: [subjectTwo.id]
		});
		const result = await LectureActions.linkSubjectsToLecture(courseEditor, form);

		expectDenied(result); // now carries a message too, see #154
		expect(errorMessages(result)).toContain("You don't have permission to edit this lecture");
		const after = await prisma.lecture.findUniqueOrThrow({
			where: { id: lecture.id },
			include: { subjects: true }
		});
		expect(after.subjects.map((s) => s.id)).toEqual([subjectOne.id]);
	});

	it('does not let a course editor delete a lecture', async () => {
		const { courseEditor, graph } = await editorGraph();
		const lecture = await createLecture(graph.id);

		const form = await buildForm(deleteLectureSchema, {
			graphId: graph.id,
			lectureId: lecture.id
		});
		const result = await LectureActions.deleteLecture(courseEditor, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to delete this lecture");
		await expect(prisma.lecture.findUnique({ where: { id: lecture.id } })).resolves.not.toBeNull();
	});
});
