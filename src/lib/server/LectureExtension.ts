import prisma from '$lib/server/prisma';

import type { SerializedLecture } from '$scripts/entities';


const dto = {
	needs: {
		id: true,
		name: true
	},
	async compute(lecture): Promise<SerializedLecture> {
		let subjects = await prisma.subject.findMany({
			where: {
				lectures: {
					some: {
						id: lecture.id
					}
				}
			}
		});
		return {
			uuid: lecture.id,
			name: lecture.name,
			subjects: subjects.map(s => s.dto)
		}
	}
}


export default {
	result: {
		lecture: {
			dto
		}
	}
}
