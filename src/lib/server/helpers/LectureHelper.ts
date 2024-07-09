import prisma from '$lib/server/prisma';

import type { SerializedLecture } from '$scripts/entities';
import type { Lecture } from '@prisma/client';


export async function create(graphId: number): Promise<number> {
	const lecture = await prisma.lecture.create({
		data: {
			graph: {
				connect: {
					id: graphId
				}
			}
		}
	});
	return lecture.id;
}


async function getSubjectIds(lecture: Lecture): Promise<number[]> {
	return (await prisma.subject.findMany({
		where: {
			lectures: {
				some: {
					id: lecture.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(s => s.id);
}


export async function toDTO(lecture: Lecture): Promise<SerializedLecture> {
	return {
		id: lecture.id,
		name: lecture.name!,
		subjects: await getSubjectIds(lecture)
	}
}


export async function updateFromDTO(dto: SerializedLecture) {
	await prisma.lecture.update({
		where: {
			id: dto.id
		},
		data: {
			name: dto.name,
			subjects: {
				connect: dto.subjects.map(s => ({ id: s }))
			}
		}
	});
}
