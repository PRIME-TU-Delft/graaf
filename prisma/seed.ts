import { Course, Subject, PrismaClient } from '@prisma/client';
import { courses, domains, programs, subjects } from './init';
import { env } from 'process';

const prisma = new PrismaClient();

async function main() {
	console.log(`Start seeding ...`);

	if (env.NETLIFY_CONTEXT != 'PROD') {
		const user = await prisma.user.create({
			data: {
				role: 'ADMIN',
				email: 'testuser@tudelft.nl',
				password: 'password',
				nickname: 'Test User',
				firstName: 'Test',
				lastName: 'User',
				emailVerified: new Date(),
				createdAt: new Date(),
				updatedAt: new Date()
			}
		});
	}

	const cs: Course[] = [];
	for (const course of courses) {
		const c = await prisma.course.create({
			data: {
				...course
			}
		});
		cs.push(c);
		console.log(`Created course with id: ${c.code}`);
	}

	console.log('\n');

	for (const program of programs) {
		const p = await prisma.program.create({
			data: {
				name: program.name,
				courses: {
					connect: program.courses.map((c) => {
						return {
							code: c.code
						};
					})
				}
			}
		});
		console.log(`Created program with id: ${p.id}`);
	}

	console.log('\n');

	const graph = await prisma.graph.create({
		data: { name: 'GraphOne', courseId: cs[0].code }
	});

	console.log(`Created graph with id: ${graph.id} \n`);

	for (let i = 0; i < domains.length; i++) {
		const domain = domains[i];
		const d = await prisma.domain.create({
			data: {
				name: domain.name,
				order: i,
				graphId: graph.id
			}
		});
		console.log(`Created domain with id: ${d.id}`);
	}

	const subjectsList: Subject[] = [];
	for (let i = 0; i < subjects.length; i++) {
		const subject = subjects[i];
		const s = await prisma.subject.create({
			data: {
				name: subject.name,
				order: i,
				graphId: graph.id
			}
		});
		subjectsList.push(s);
		console.log(`Created subject with id: ${s.id}`);
	}

	console.log('\n');

	await prisma.lecture.create({
		data: {
			name: 'LectureOne',
			order: 0,
			graphId: graph.id,
			// Connect to subject 1,2,3
			subjects: {
				connect: [
					{ id: subjectsList[0].id },
					{ id: subjectsList[1].id },
					{ id: subjectsList[2].id }
				]
			}
		}
	});

	await prisma.lecture.create({
		data: {
			name: 'LectureTwo',
			order: 1,
			graphId: graph.id,
			// Connect to subject 4,5
			subjects: {
				connect: [{ id: subjectsList[3].id }]
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
