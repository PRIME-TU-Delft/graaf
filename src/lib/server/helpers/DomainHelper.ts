import prisma from '$lib/server/prisma';

import type { SerializedDomain } from '$scripts/entities';
import type { Domain } from '@prisma/client';


export async function create(graphId: number): Promise<number> {
	const domain = await prisma.domain.create({
		data: {
			graph: {
				connect: {
					id: graphId
				}
			}
		}
	});
	return domain.id;
}


export async function remove(domainId: number): Promise<void> {
	await prisma.domain.delete({
		where: {
			id: domainId
		}
	});
}


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
		},
		orderBy: {
			id: 'asc'
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
		},
		orderBy: {
			id: 'asc'
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


/**
 * Updates a Domain object in the database to a SerializedDomain object sent by the client.
 * @param dto SerializedDomain object
 */
export async function updateFromDTO(dto: SerializedDomain): Promise<void> {
	await prisma.domain.update({
		where: {
			id: dto.id
		},
		data: {
			name: dto.name,
			x: dto.x,
			y: dto.y,
			style: dto.style,
			childDomains: {
				connect: dto.children.map(id => ({ id }))
			},
			parentDomains: {
				connect: dto.parents.map(id => ({ id }))
			}
		}
	});
}
