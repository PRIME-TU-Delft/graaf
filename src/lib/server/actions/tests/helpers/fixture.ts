import prisma from '$lib/server/db/prisma';

// See the "Testing" section of README.md for the fixture diagram this mirrors.

export const FIXTURE_EMAILS = {
	superAdmin: 'super-admin@fixture.test',
	programAdmin: 'program-admin@fixture.test',
	programEditor: 'program-editor@fixture.test',
	courseAdmin: 'course-admin@fixture.test',
	courseEditor: 'course-editor@fixture.test'
} as const;

export const FIXTURE_PROGRAMS = {
	one: 'ProgramOne',
	two: 'ProgramTwo',
	three: 'ProgramThree'
} as const;

export const FIXTURE_COURSES = {
	one: { code: 'FIXTURE-1', uriCode: 'fixture-course-one', name: 'CourseOne' },
	two: { code: 'FIXTURE-2', uriCode: 'fixture-course-two', name: 'CourseTwo' },
	three: { code: 'FIXTURE-3', uriCode: 'fixture-course-three', name: 'CourseThree' }
} as const;

export const FIXTURE_GRAPHS = {
	one: 'GraphOne',
	two: 'GraphTwo',
	three: 'GraphThree'
} as const;

async function resetDatabase() {
	await prisma.$transaction([
		prisma.link.deleteMany(),
		prisma.lecture.deleteMany(),
		prisma.subject.deleteMany(),
		prisma.domain.deleteMany(),
		prisma.graph.deleteMany(),
		prisma.sandbox.deleteMany(),
		prisma.course.deleteMany(),
		prisma.program.deleteMany(),
		prisma.user.deleteMany()
	]);
}

// Seeds GraphOne's content (or a copy of it, for GraphTwo/GraphThree) onto the given graph:
// DomainOne -> DomainTwo -> DomainThree, SubjectThree -> SubjectTwo -> SubjectOne,
// with SubjectOne & SubjectTwo mapped to DomainOne, and SubjectThree mapped to DomainTwo.
async function seedGraphContent(graphId: number) {
	const domainOne = await prisma.domain.create({ data: { name: 'DomainOne', order: 0, graphId } });
	const domainTwo = await prisma.domain.create({ data: { name: 'DomainTwo', order: 1, graphId } });
	const domainThree = await prisma.domain.create({
		data: { name: 'DomainThree', order: 2, graphId }
	});

	await prisma.domain.update({
		where: { id: domainOne.id },
		data: { targetDomains: { connect: { id: domainTwo.id } } }
	});
	await prisma.domain.update({
		where: { id: domainTwo.id },
		data: {
			sourceDomains: { connect: { id: domainOne.id } },
			targetDomains: { connect: { id: domainThree.id } }
		}
	});
	await prisma.domain.update({
		where: { id: domainThree.id },
		data: { sourceDomains: { connect: { id: domainTwo.id } } }
	});

	const subjectOne = await prisma.subject.create({
		data: { name: 'SubjectOne', order: 0, graphId, domainId: domainOne.id }
	});
	const subjectTwo = await prisma.subject.create({
		data: { name: 'SubjectTwo', order: 1, graphId, domainId: domainOne.id }
	});
	const subjectThree = await prisma.subject.create({
		data: { name: 'SubjectThree', order: 2, graphId, domainId: domainTwo.id }
	});

	await prisma.subject.update({
		where: { id: subjectThree.id },
		data: { targetSubjects: { connect: { id: subjectTwo.id } } }
	});
	await prisma.subject.update({
		where: { id: subjectTwo.id },
		data: {
			sourceSubjects: { connect: { id: subjectThree.id } },
			targetSubjects: { connect: { id: subjectOne.id } }
		}
	});
	await prisma.subject.update({
		where: { id: subjectOne.id },
		data: { sourceSubjects: { connect: { id: subjectTwo.id } } }
	});
}

/**
 * Wipes the test database and reseeds it with the fixture documented in README.md's Testing
 * section: three programs, each linked to three courses, with CourseOne/Two/Three owning
 * GraphOne/Two/Three (identical content, copied not shared).
 */
export async function seedFixture() {
	await resetDatabase();

	const [, programAdmin, programEditor, courseAdmin, courseEditor] = await Promise.all([
		prisma.user.create({
			data: { role: 'ADMIN', email: FIXTURE_EMAILS.superAdmin, nickname: 'Super Admin' }
		}),
		prisma.user.create({ data: { email: FIXTURE_EMAILS.programAdmin, nickname: 'Program Admin' } }),
		prisma.user.create({
			data: { email: FIXTURE_EMAILS.programEditor, nickname: 'Program Editor' }
		}),
		prisma.user.create({ data: { email: FIXTURE_EMAILS.courseAdmin, nickname: 'Course Admin' } }),
		prisma.user.create({ data: { email: FIXTURE_EMAILS.courseEditor, nickname: 'Course Editor' } })
	]);

	const courseOne = await prisma.course.create({ data: FIXTURE_COURSES.one });
	const courseTwo = await prisma.course.create({
		data: { ...FIXTURE_COURSES.two, admins: { connect: { id: courseAdmin.id } } }
	});
	const courseThree = await prisma.course.create({
		data: { ...FIXTURE_COURSES.three, editors: { connect: { id: courseEditor.id } } }
	});
	const allCourses = {
		connect: [{ id: courseOne.id }, { id: courseTwo.id }, { id: courseThree.id }]
	};

	await prisma.program.create({ data: { name: FIXTURE_PROGRAMS.one, courses: allCourses } });
	await prisma.program.create({
		data: {
			name: FIXTURE_PROGRAMS.two,
			admins: { connect: { id: programAdmin.id } },
			courses: allCourses
		}
	});
	await prisma.program.create({
		data: {
			name: FIXTURE_PROGRAMS.three,
			editors: { connect: { id: programEditor.id } },
			courses: allCourses
		}
	});

	const graphOne = await prisma.graph.create({
		data: { name: FIXTURE_GRAPHS.one, parentType: 'COURSE', courseId: courseOne.id }
	});
	const graphTwo = await prisma.graph.create({
		data: { name: FIXTURE_GRAPHS.two, parentType: 'COURSE', courseId: courseTwo.id }
	});
	const graphThree = await prisma.graph.create({
		data: { name: FIXTURE_GRAPHS.three, parentType: 'COURSE', courseId: courseThree.id }
	});

	await seedGraphContent(graphOne.id);
	await seedGraphContent(graphTwo.id);
	await seedGraphContent(graphThree.id);
}

// Lookups. `resetDatabase` deletes rows rather than truncating, so Postgres keeps incrementing
// its id sequences across reseeds and no numeric id is stable between test files. Everything
// below resolves rows by their fixture name/code/email instead.

/** The five fixture users, keyed the same way as FIXTURE_EMAILS. */
export async function fixtureUsers() {
	const users = await prisma.user.findMany({
		where: { email: { in: Object.values(FIXTURE_EMAILS) } }
	});

	const byEmail = (email: string) => {
		const user = users.find((u) => u.email === email);
		if (!user) throw new Error(`Fixture user ${email} is missing, was seedFixture() called?`);
		return user;
	};

	return {
		superAdmin: byEmail(FIXTURE_EMAILS.superAdmin),
		programAdmin: byEmail(FIXTURE_EMAILS.programAdmin),
		programEditor: byEmail(FIXTURE_EMAILS.programEditor),
		courseAdmin: byEmail(FIXTURE_EMAILS.courseAdmin),
		courseEditor: byEmail(FIXTURE_EMAILS.courseEditor)
	};
}

/** A user who exists but holds no program, course, or sandbox role anywhere. */
export async function createOutsider(email = 'outsider@fixture.test') {
	return await prisma.user.create({ data: { email, nickname: 'Outsider' } });
}

/**
 * @param name - One of FIXTURE_PROGRAMS
 * @returns The seeded program with that name
 */
export async function getProgram(name: string) {
	return await prisma.program.findFirstOrThrow({ where: { name } });
}

/**
 * @param code - One of FIXTURE_COURSES' codes
 * @returns The seeded course with that code
 */
export async function getCourse(code: string) {
	return await prisma.course.findFirstOrThrow({ where: { code } });
}

/**
 * @param name - One of FIXTURE_GRAPHS
 * @returns The seeded graph with that name
 */
export async function getGraph(name: string) {
	return await prisma.graph.findFirstOrThrow({ where: { name } });
}

/**
 * @param graphId - The graph the domain belongs to
 * @param name - DomainOne, DomainTwo, or DomainThree
 * @returns That graph's copy of the named domain
 */
export async function getDomain(graphId: number, name: string) {
	return await prisma.domain.findFirstOrThrow({ where: { graphId, name } });
}

/**
 * @param graphId - The graph the subject belongs to
 * @param name - SubjectOne, SubjectTwo, or SubjectThree
 * @returns That graph's copy of the named subject
 */
export async function getSubject(graphId: number, name: string) {
	return await prisma.subject.findFirstOrThrow({ where: { graphId, name } });
}

// Creators for the entities seedFixture deliberately leaves out. Call these from the individual
// test files that need them rather than from seedFixture, since most files do not.

// Sandbox.code/uriCode are unique, so fixture sandboxes each need a code of their own; a
// module-level counter (rather than deriving one from `name`, which callers often leave at its
// default) keeps every call across a test file distinct without callers having to think about it.
let sandboxCodeCounter = 0;

/**
 * @param ownerId - The user who owns the sandbox
 * @param editorIds - Users to attach as sandbox editors
 * @param name - The sandbox name
 * @param code - The sandbox code/uriCode; auto-generated and unique if omitted
 * @returns The created sandbox
 */
export async function createSandbox(
	ownerId: string,
	editorIds: string[] = [],
	name = 'Sandbox',
	code = `fixture-sandbox-${++sandboxCodeCounter}`
) {
	return await prisma.sandbox.create({
		data: {
			name,
			code,
			uriCode: encodeURIComponent(code),
			ownerId,
			editors: { connect: editorIds.map((id) => ({ id })) }
		}
	});
}

/**
 * @param sandboxId - The sandbox to attach the graph to
 * @param name - The graph name
 * @returns The created graph, with parentType SANDBOX
 */
export async function createSandboxGraph(sandboxId: number, name = 'SandboxGraph') {
	return await prisma.graph.create({ data: { name, parentType: 'SANDBOX', sandboxId } });
}

/**
 * @param graphId - The graph to attach the lecture to
 * @param subjectIds - Subjects to link into the lecture
 * @param name - The lecture name
 * @returns The created lecture
 */
export async function createLecture(graphId: number, subjectIds: number[] = [], name = 'Lecture') {
	return await prisma.lecture.create({
		data: { name, order: 0, graphId, subjects: { connect: subjectIds.map((id) => ({ id })) } }
	});
}

/**
 * @param courseId - The course the link belongs to
 * @param graphId - The graph the link points at
 * @param name - The link alias, max MAX_LINK_NAME_LENGTH characters
 * @returns The created link, with parentType COURSE
 */
export async function createCourseLink(courseId: number, graphId: number, name = 'course-link') {
	return await prisma.link.create({
		data: { name, parentType: 'COURSE', courseId, graphId }
	});
}

/**
 * @param sandboxId - The sandbox the link belongs to
 * @param graphId - The graph the link points at
 * @param name - The link alias, max MAX_LINK_NAME_LENGTH characters
 * @returns The created link, with parentType SANDBOX
 */
export async function createSandboxLink(sandboxId: number, graphId: number, name = 'sb-link') {
	return await prisma.link.create({
		data: { name, parentType: 'SANDBOX', sandboxId, graphId }
	});
}
