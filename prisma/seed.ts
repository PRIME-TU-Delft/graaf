import { PrismaClient } from '@prisma/client';
import { courses, programs } from './init';

const prisma = new PrismaClient();

async function main() {
	console.log(`Start seeding ...`);
	for (const course of courses) {
		const c = await prisma.course.create({
			data: {
				...course
			}
		});
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
