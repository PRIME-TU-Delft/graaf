import prisma from '$lib/server/prisma';

import type { SerializedDomain } from '$scripts/entities';
import type { Domain } from '@prisma/client';


/**
 * Plain Domain objects dont have a children (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the children of the domain
 */
const getChildIds = {
	needs: { id: true },
	async compute(domain: Domain): Promise<number[]> {
		return (await prisma.domain.findMany({
			where: {
				parentDomains: {
					some: {
						id: domain.id
					}
				}
			}
		})).map(d => d.id);
	}
}


/**
 * Plain Domain objects dont have a parents (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the parents of the domain
 */
const getParentIds = {
	needs: { id: true },
	async compute(domain: Domain): Promise<number[]> {
		return (await prisma.domain.findMany({
			where: {
				parentDomains: {
					some: {
						id: domain.id
					}
				}
			}
		})).map(d => d.id);
	}
}


/**
 * Converts a Domain object to a SerializedDomain object, which can be sent to the client.
 * @param domain plain Domain object
 * @returns SerializedDomain object
 */
const dto = {
	needs: {
		id: true,
		name: true,
		x: true,
		y: true,
		style: true
	},
	async compute(domain: Domain): Promise<SerializedDomain> {
		return {
			id: domain.id,
			name: domain.name,
			x: domain.x,
			y: domain.y,
			style: domain.style,
			parents: await getParentIds.compute(domain),
			children: await getChildIds.compute(domain)
		}
	}
}


export default {
	result: {
		domain: {
			dto,
			getChildIds,
			getParentIds
		}
	},
}
