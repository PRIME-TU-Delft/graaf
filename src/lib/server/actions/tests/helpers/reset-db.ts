import prisma from '$lib/server/db/prisma';

export default async () => {
	console.log('DELETE DATA');

	await prisma.$transaction([
		prisma.graph.deleteMany(),
		prisma.course.deleteMany(),
		prisma.user.deleteMany(),
		prisma.program.deleteMany(),
		prisma.domain.deleteMany(),
		prisma.subject.deleteMany(),
		prisma.lecture.deleteMany()
	]);
};
