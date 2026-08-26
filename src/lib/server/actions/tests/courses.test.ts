import { beforeEach, describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';

import prisma from '$lib/server/db/prisma';
import { CourseActions } from '$lib/server/actions/Courses';
import {
	changeArchiveSchema,
	deleteCourseSchema,
	editCourseSchema,
	editSuperUserSchema,
	linkingCoursesSchema,
	newCourseSchema
} from '$lib/zod/courseSchema';

import {
	FIXTURE_COURSES,
	FIXTURE_PROGRAMS,
	createOutsider,
	fixtureUsers,
	getCourse,
	getProgram,
	seedFixture
} from './helpers/fixture';
import { asErrorObject, buildForm, errorMessages, expectDenied } from './helpers/actions';

// CourseActions.changePin is deliberately not covered: it has no permission gate at all, any
// authenticated user may pin any course for themselves.
//
// Denials that run through withPermissionCheck now assert the entity-specific message too, since
// that helper correctly matches Prisma 7's P2025 shape (#153). linkCourses hand-rolls its own
// setError calls, so its wording was already asserted directly.

beforeEach(seedFixture);

describe('CourseActions.newCourse', () => {
	// Gated on ProgramAdminEditor against the destination program.

	it('allows a program editor to create a course in their program', async () => {
		const { programEditor } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.three);

		const form = await buildForm(newCourseSchema, {
			code: 'NEW1',
			name: 'NewCourse',
			programId: program.id
		});
		const result = await CourseActions.newCourse(programEditor, form);

		expect(result).not.toHaveProperty('status');
		await expect(prisma.course.findFirst({ where: { code: 'NEW1' } })).resolves.not.toBeNull();
	});

	it('denies a course admin, who holds no program role', async () => {
		const { courseAdmin } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.three);

		const form = await buildForm(newCourseSchema, {
			code: 'NEW2',
			name: 'NewCourse',
			programId: program.id
		});
		const result = await CourseActions.newCourse(courseAdmin, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to create a new course");
		await expect(prisma.course.findFirst({ where: { code: 'NEW2' } })).resolves.toBeNull();
	});
});

describe('CourseActions.editCourse', () => {
	// Gated on CourseAdminORProgramAdminEditor, which excludes course editors.

	it('allows the course admin', async () => {
		const { courseAdmin } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.two.code);

		const form = await buildForm(editCourseSchema, { courseId: course.id, name: 'Renamed' });
		const result = await CourseActions.editCourse(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.course.findUniqueOrThrow({ where: { id: course.id } })
		).resolves.toMatchObject({ name: 'Renamed' });
	});

	it('denies a course editor, one tier below', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);

		const form = await buildForm(editCourseSchema, { courseId: course.id, name: 'Renamed' });
		const result = await CourseActions.editCourse(courseEditor, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit this course");
		await expect(
			prisma.course.findUniqueOrThrow({ where: { id: course.id } })
		).resolves.toMatchObject({ name: FIXTURE_COURSES.three.name });
	});
});

describe('CourseActions.changeArchive', () => {
	it('allows the course admin', async () => {
		const { courseAdmin } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.two.code);

		const form = await buildForm(changeArchiveSchema, { courseId: course.id, archive: true });
		const result = await CourseActions.changeArchive(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		await expect(
			prisma.course.findUniqueOrThrow({ where: { id: course.id } })
		).resolves.toMatchObject({ isArchived: true });
	});

	it('denies a course editor and leaves the archive flag untouched', async () => {
		const { courseEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.three.code);

		const form = await buildForm(changeArchiveSchema, { courseId: course.id, archive: true });
		const result = await CourseActions.changeArchive(courseEditor, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to (de)archive this course");
		await expect(
			prisma.course.findUniqueOrThrow({ where: { id: course.id } })
		).resolves.toMatchObject({ isArchived: false });
	});
});

describe('CourseActions.editSuperUser', () => {
	it('allows the course admin to grant an editor role', async () => {
		const { courseAdmin } = await fixtureUsers();
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.two.code);

		const form = await buildForm(editSuperUserSchema, {
			courseId: course.id,
			userId: outsider.id,
			role: 'editor'
		});
		const result = await CourseActions.editSuperUser(courseAdmin, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.course.findUniqueOrThrow({
			where: { id: course.id },
			include: { editors: true }
		});
		expect(after.editors.map((e) => e.id)).toContain(outsider.id);
	});

	it('denies a course editor and grants nobody anything', async () => {
		const { courseEditor } = await fixtureUsers();
		const outsider = await createOutsider();
		const course = await getCourse(FIXTURE_COURSES.three.code);

		const form = await buildForm(editSuperUserSchema, {
			courseId: course.id,
			userId: outsider.id,
			role: 'admin'
		});
		const result = await CourseActions.editSuperUser(courseEditor, form);

		expectDenied(result);
		expect(errorMessages(result)).toContain("You don't have permission to edit super users");
		const after = await prisma.course.findUniqueOrThrow({
			where: { id: course.id },
			include: { admins: true, editors: true }
		});
		expect(after.admins).toHaveLength(0);
		expect(after.editors.map((e) => e.id)).not.toContain(outsider.id);
	});
});

describe('CourseActions.deleteCourse', () => {
	// Gated on the ProgramAdminEditor tier. Succeeds by throwing a redirect, fails with { error }.

	it('allows a program editor, redirecting on success', async () => {
		const { programEditor } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.one.code);

		const form = await buildForm(deleteCourseSchema, { courseId: course.id });
		await expect(CourseActions.deleteCourse(programEditor, form)).rejects.toSatisfy(isRedirect);

		await expect(prisma.course.findUnique({ where: { id: course.id } })).resolves.toBeNull();
	});

	it('denies a course admin and leaves the course in place', async () => {
		const { courseAdmin } = await fixtureUsers();
		const course = await getCourse(FIXTURE_COURSES.two.code);

		const form = await buildForm(deleteCourseSchema, { courseId: course.id });
		const result = await CourseActions.deleteCourse(courseAdmin, form);

		expect(asErrorObject(result).error).toBeTruthy();
		await expect(prisma.course.findUnique({ where: { id: course.id } })).resolves.not.toBeNull();
	});
});

describe('CourseActions.linkCourses', () => {
	// Regression coverage for #26 / #141. The fixture links every course into every program, so a
	// program editor already holds rights on all of them via the program. To get a caller who
	// passes the program gate but lacks rights on one course, this builds a separate program that
	// owns no courses and a user who administers it plus exactly one course.

	const OWN_PROGRAM = 'ProgramFour';

	async function seedPartialRightsLinker() {
		const courseTwo = await getCourse(FIXTURE_COURSES.two.code);
		const linker = await prisma.user.create({
			data: {
				email: 'linker@fixture.test',
				nickname: 'Linker',
				course_admins: { connect: { id: courseTwo.id } }
			}
		});
		const program = await prisma.program.create({
			data: { name: OWN_PROGRAM, admins: { connect: { id: linker.id } } }
		});

		return { linker, program, courseTwo };
	}

	it('allows linking a course the caller has rights on', async () => {
		const { linker, program, courseTwo } = await seedPartialRightsLinker();

		const form = await buildForm(linkingCoursesSchema, {
			programId: program.id,
			courseIds: [courseTwo.id]
		});
		const result = await CourseActions.linkCourses(linker, form);

		expect(result).not.toHaveProperty('status');
		const after = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: { courses: true }
		});
		expect(after.courses.map((c) => c.id)).toEqual([courseTwo.id]);
	});

	it('rejects a mixed batch whole, linking neither course', async () => {
		const { linker, program, courseTwo } = await seedPartialRightsLinker();
		const courseOne = await getCourse(FIXTURE_COURSES.one.code);

		const form = await buildForm(linkingCoursesSchema, {
			programId: program.id,
			courseIds: [courseTwo.id, courseOne.id]
		});
		const result = await CourseActions.linkCourses(linker, form);

		expect(errorMessages(result)).toContain(
			"You don't have permission on 1 of the selected courses"
		);

		// The whole point of the regression: the eligible course must not be linked either.
		const after = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: { courses: true }
		});
		expect(after.courses).toHaveLength(0);
	});

	it('allows unlinking courses from a program the caller administers', async () => {
		// There is no mixed-eligibility case to test on the unlink path: a course that sits in the
		// caller's own program is, by that fact, covered by their program role, so any course they
		// can see attached to the program is one they may detach. The batch check still runs.
		const { linker, program, courseTwo } = await seedPartialRightsLinker();
		const courseOne = await getCourse(FIXTURE_COURSES.one.code);

		await prisma.program.update({
			where: { id: program.id },
			data: { courses: { connect: [{ id: courseTwo.id }, { id: courseOne.id }] } }
		});

		const form = await buildForm(linkingCoursesSchema, {
			programId: program.id,
			courseIds: [courseTwo.id, courseOne.id]
		});
		const result = await CourseActions.linkCourses(linker, form, { link: false });

		expect(result).not.toHaveProperty('status');
		const after = await prisma.program.findUniqueOrThrow({
			where: { id: program.id },
			include: { courses: true }
		});
		expect(after.courses).toHaveLength(0);
	});

	it('denies a caller with no rights on the destination program', async () => {
		const { courseAdmin } = await fixtureUsers();
		const program = await getProgram(FIXTURE_PROGRAMS.one);
		const course = await getCourse(FIXTURE_COURSES.two.code);

		const form = await buildForm(linkingCoursesSchema, {
			programId: program.id,
			courseIds: [course.id]
		});
		const result = await CourseActions.linkCourses(courseAdmin, form);

		expect(errorMessages(result)).toContain(
			"You don't have permission to link/unlink courses in this program"
		);
	});
});
