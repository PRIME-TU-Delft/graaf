
import prisma from '$lib/server/prisma'

import type { Domain as PrismaDomain } from '@prisma/client'
import type { SerializedDomain } from '$scripts/entities'

export { create, remove, makeDTO, setName }


// ----------------> Helper functions <----------------


/**
 * Creates a Domain object in the database.
 * @param graphId id of the Graph object to which the Domain object belongs
 * @returns id of the created Domain object
 */

async function create(graphId: number): Promise<number> {
	const domain = await prisma.domain.create({
		data: {
			graph: {
				connect: {
					id: graphId
				}
			}
		}
	})

	return domain.id
}

/**
 * Removes a Domain object from the database.
 * @param domainId id of the Domain object to remove
 * @returns void
 */

async function remove(domainId: number): Promise<void> {
	await prisma.domain.delete({
		where: {
			id: domainId
		}
	})
}

/**
 * Converts a Domain object to a SerializedDomain object, which can be sent to the client.
 * @param domain plain Domain object
 * @returns SerializedDomain object
 */

async function makeDTO(domain: PrismaDomain): Promise<SerializedDomain> {
	return {
		id: domain.id,
		x: domain.x,
		y: domain.y,
		name: domain.name || undefined,
		style: domain.style || undefined,
		children: await getChildIds(domain),
		parents: await getParentIds(domain)
	}
}

/**
 * Updates the name of a Domain object.
 * @param domainId id of the Domain object to update
 * @param name new name of the Domain object
 * @returns void
 */

async function setName(domainId: number, name: string): Promise<void> {
	await prisma.domain.update({
		where: {
			id: domainId
		},
		data: {
			name
		}
	})
}

/**
 * Plain Domain objects dont have a children (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the children of the domain
 */

async function getChildIds(domain: PrismaDomain): Promise<number[]> {
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
	})).map(d => d.id)
}

/**
 * Plain Domain objects dont have a parents (many-to-many) field,
 * this method makes them available.
 * @param domain plain Domain object
 * @returns the ids of the parents of the domain
 */

async function getParentIds(domain: PrismaDomain): Promise<number[]> {
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
	})).map(d => d.id)
}