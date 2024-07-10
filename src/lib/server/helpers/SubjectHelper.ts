import prisma from '$lib/server/prisma';

import type { SerializedSubject } from '$scripts/entities';
import type { Subject } from '@prisma/client';


export async function create(graphId: number): Promise<number> {
	const subject = await prisma.subject.create({
		data: {
			graph: {
				connect: {
					id: graphId
				}
			}
		}
	});
	return subject.id;
}


export async function remove(subjectId: number): Promise<void> {
	await prisma.subject.delete({
		where: {
			id: subjectId
		}
	});
}


// TODO: what if a subject has no domain yet?
async function getDomainId(subject: Subject): Promise<number> {
	return (await prisma.subject.findUnique({
		where: {
			id: subject.id
		}
	}))?.domainId!;
}


async function getChildIds(subject: Subject): Promise<number[]> {
	return (await prisma.subject.findMany({
		where: {
			parentSubjects: {
				some: {
					id: subject.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(d => d.id);
}


async function getParentIds(subject: Subject): Promise<number[]> {
	return (await prisma.subject.findMany({
		where: {
			childSubjects: {
				some: {
					id: subject.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(d => d.id);
}


/***
 * Converts a Subject object to a SerializedSubject object, which can be sent to the client.
 * @param subject plain Subject object
 * @returns SerializedSubject object
 */
export async function toDTO(subject: Subject): Promise<SerializedSubject> {
	return {
		id: subject.id,
		x: subject.x,
		y: subject.y,
		domain: await getDomainId(subject),
		name: subject.name!,  // TODO: what if a subject has no name? Validate before converting and throw error?
		children: await getChildIds(subject),
		parents: await getParentIds(subject)
	}
}


/**
 * Updates a Subject object in the database to a SerializedSubject object sent by the client.
 * @param dto SerializedSubject object
 */
export async function updateFromDTO(dto: SerializedSubject): Promise<void> {
	const domain = dto.domain ? {
		connect: {
			id: dto.domain
		}
	} : undefined;

	await prisma.subject.update({
		where: {
			id: dto.id
		},
		data: {
			x: dto.x,
			y: dto.y,
			domain,
			name: dto.name,
			childSubjects: {
				connect: dto.children.map(id => ({ id }))
			},
			parentSubjects: {
				connect: dto.parents.map(id => ({ id }))
			}
		}
	});
}
