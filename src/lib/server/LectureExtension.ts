import prisma from '$lib/server/prisma';

import type { SerializedLecture } from '$scripts/entities';
import type { Lecture } from '@prisma/client';


const getSubjectIds = {
	needs: { id: true },
	async compute(lecture: Lecture): Promise<number[]> {
		return (await prisma.subject.findMany({
			where: {
				lectures: {
					some: {
						id: lecture.id
					}
				}
			}
		})).map(s => s.id);
	}
}


const dto = {
	needs: {
		id: true,
		name: true
	},
	async compute(lecture: Lecture): Promise<SerializedLecture> {
		return {
			id: lecture.id,
			name: lecture.name,
			subjects: await getSubjectIds.compute(lecture)
		}
	}
}


export default {
	result: {
		lecture: {
			dto,
			getSubjectIds
		}
	}
}
