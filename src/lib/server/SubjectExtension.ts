import prisma from '$lib/server/prisma';

import type { SerializedSubject } from '$scripts/entities';
import type { Subject } from '@prisma/client';


// TODO: what if a subject has no domain yet?
const getDomainId = {
	needs: { id: true },
	async compute(subject: Subject): Promise<number> {
		return (await prisma.subject.findUnique({
			where: {
				id: subject.id
			}
		}))?.domainId!;
	}
}


const getChildIds = {
	needs: { id: true },
	async compute(subject: Subject): Promise<number[]> {
		return (await prisma.subject.findMany({
			where: {
				parentSubjects: {
					some: {
						id: subject.id
					}
				}
			}
		})).map(d => d.id);
	}
}


const getParentIds = {
	needs: { id: true },
	async compute(subject: Subject): Promise<number[]> {
		return (await prisma.subject.findMany({
			where: {
				childSubjects: {
					some: {
						id: subject.id
					}
				}
			}
		})).map(d => d.id);
	}
}


/***
 * Converts a Subject object to a SerializedSubject object, which can be sent to the client.
 * @param subject plain Subject object
 * @returns SerializedSubject object
 */
const dto = {
	needs: {
		id: true,
		name: true
	},
	async compute(subject: Subject): Promise<SerializedSubject> {
		return {
			id: subject.id,
			x: subject.x,
			y: subject.y,
			domain: await getDomainId.compute(subject),
			name: subject.name!,  // TODO: what if a subject has no name? Validate before converting and throw error?
			children: await getChildIds.compute(subject),
			parents: await getParentIds.compute(subject)
		}
	}
}


export default {
	result: {
		subject: {
			dto,
			getDomainId,
			getChildIds,
			getParentIds
		}
	}
}
