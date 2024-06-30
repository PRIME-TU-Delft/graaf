import prisma from '$lib/server/prisma';

import type { SerializedGraph } from '$scripts/entities';
import type { Graph } from '@prisma/client';


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


const getDomains = {
	needs: { id: true },
	async compute(graph: Graph) {
		return await prisma.domain.findMany({
			where: {
				graphId: graph.id
			}
		})
	}
}


const getSubjects = {
	needs: { id: true },
	async compute(graph: Graph) {
		return await prisma.subject.findMany({
			where: {
				graphId: graph.id
			}
		})
	}
}


const getLectures = {
	needs: { id: true },
	async compute(graph: Graph) {
		return await prisma.lecture.findMany({
			where: {
				graphId: graph.id
			}
		})
	}
}


const dto = {
	needs: {
		id: true,
		name: true
	},
	async compute(graph: Graph): Promise<SerializedGraph> {
		return {
			id: graph.id,
			name: graph.name,
			domains: await Promise.all((await getDomains.compute(graph)).map(d => d.dto)),
			subjects: await Promise.all((await getSubjects.compute(graph)).map(s => s.dto)),
			lectures: await Promise.all((await getLectures.compute(graph)).map(l => l.dto))
		}
	}

}



export default {
	model: {
		graph: {
			createWithCourseCode
		}
	}
}
