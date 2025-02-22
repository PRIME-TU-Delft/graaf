import prisma from '$lib/server/db/prisma';

export default async () => {
	await prisma.$transaction([
		prisma.user.deleteMany(),
		prisma.program.deleteMany(),
		prisma.course.deleteMany(),
		prisma.graph.deleteMany(),
		prisma.domain.deleteMany(),
		prisma.subject.deleteMany(),
		prisma.lecture.deleteMany()
	]);
};
