import prisma from '$lib/server/prisma';

import type { SerializedDomain } from '$scripts/entities';
import type { Domain } from '@prisma/client';


/**
 * Plain Domain objects dont have a children (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the children of the domain
 */
async function getChildIds(domain: Domain): Promise<number[]> {
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


/**
 * Plain Domain objects dont have a parents (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the parents of the domain
 */
async function getParentIds(domain: Domain): Promise<number[]> {
	return (await prisma.domain.findMany({
		where: {
			childDomains: {
				some: {
					id: domain.id
				}
			}
		}
	})).map(d => d.id);
}


/**
 * Converts a Domain object to a SerializedDomain object, which can be sent to the client.
 * @param domain plain Domain object
 * @returns SerializedDomain object
 */
export async function toDTO(domain: Domain): Promise<SerializedDomain> {
	return {
		id: domain.id,
		name: domain.name!,
		x: domain.x,
		y: domain.y,
		style: domain.style!,
		children: await getChildIds(domain),
		parents: await getParentIds(domain)
	}
}