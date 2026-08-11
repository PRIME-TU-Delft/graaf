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
