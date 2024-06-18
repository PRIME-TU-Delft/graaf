import prisma from '$lib/server/prisma';


async function createWithCourseCode(courseCode: string, name: string) {
	await prisma.graph.create({
		data: {
			name,
			course: {
				connect: {
					code: courseCode
				}
			}
		}
	});
}


export default {
	model: {
		graph: {
			createWithCourseCode
		}
	}
}
