import { Course, Subject, PrismaClient } from '@prisma/client';
import { courses, domains, programs, subjects } from './init';
import { env } from 'process';

const prisma = new PrismaClient();

async function main() {
	console.log(`Start seeding ...`);

	await prisma.$transaction([
		prisma.graph.deleteMany(),
		prisma.course.deleteMany(),
		prisma.user.deleteMany(),
		prisma.program.deleteMany(),
		prisma.domain.deleteMany(),
		prisma.subject.deleteMany(),
		prisma.lecture.deleteMany()
	]);

	if (env.NETLIFY_CONTEXT != 'PROD') {
		await prisma.user.create({
			data: {
				role: 'ADMIN',
				email: 'testuser@tudelft.nl',
				nickname: 'Test User',
				firstName: 'Test',
				lastName: 'User',
				emailVerified: new Date(),
				createdAt: new Date(),
				updatedAt: new Date()
			}
		});
	}

	const prisma_courses: Course[] = [];
	for (const course of courses) {
		const prisma_course = await prisma.course.create({
			data: {
				...course
			}
		});

		prisma_courses.push(prisma_course);
		console.log(`Created course with id: ${prisma_course.code}`);
	}

	console.log('\n');

	for (const program of programs) {
		const prisma_program = await prisma.program.create({
			data: {
				name: program.name,
				courses: {
					connect: program.courses.map((course) => {
						return {
							code: course.code
						};
					})
				}
			}
		});

		console.log(`Created program with id: ${prisma_program.id}`);
	}

	console.log('\n');

	const graph = await prisma.graph.create({
		data: { name: 'GraphOne', courseId: prisma_courses[0].code }
	});

	console.log(`Created graph with id: ${graph.id} \n`);

	for (let i = 0; i < domains.length; i++) {
		const domain = domains[i];
		const prisma_domains = await prisma.domain.create({
			data: {
				name: domain.name,
				order: i,
				graphId: graph.id
			}
		});

		console.log(`Created domain with id: ${prisma_domains.id}`);
	}

	const prisma_subjects: Subject[] = [];
	for (let i = 0; i < subjects.length; i++) {
		const subject = subjects[i];
		const prisma_subject = await prisma.subject.create({
			data: {
				name: subject.name,
				order: i,
				graphId: graph.id
			}
		});

		prisma_subjects.push(prisma_subject);
		console.log(`Created subject with id: ${prisma_subject.id}`);
	}

	console.log('\n');

	await prisma.lecture.create({
		data: {
			name: 'LectureOne',
			order: 0,
			graphId: graph.id,
			subjects: {
				connect: [
					{ id: prisma_subjects[0].id },
					{ id: prisma_subjects[1].id },
					{ id: prisma_subjects[2].id }
				]
			}
		}
	});

	await prisma.lecture.create({
		data: {
			name: 'LectureTwo',
			order: 1,
			graphId: graph.id,
			subjects: {
				connect: [{ id: prisma_subjects[3].id }]
			}
		}
	});

	console.log(`Seeding finished.`);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
