import prisma from '$lib/server/prisma';

import type { SerializedLecture } from '$scripts/entities';
import type { Lecture } from '@prisma/client';


async function getSubjectIds(lecture: Lecture): Promise<number[]> {
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


export async function toDTO(lecture: Lecture): Promise<SerializedLecture> {
	return {
		id: lecture.id,
		name: lecture.name,
		subjects: await getSubjectIds(lecture)
	}
}