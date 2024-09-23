
import prisma from '$lib/server/prisma'

import type { Domain as PrismaDomain } from '@prisma/client'
import type { SerializedDomain } from '$scripts/entities'

export { create, remove, setX, setY, setName, setStyle, setParents, setChildren, makeDTO }


// ----------------> Internal


type RelationalQuery = {
	where: { id: number },
	data: {
		childDomains: {
			connect: { id: number }[],
			disconnect: { id: number }[]
		},
		parentDomains: {
			connect: { id: number }[],
			disconnect: { id: number }[]
		}
	}
}

function ensureQueryExists(queries: RelationalQuery[], id: number) {
	if (!queries.some(q => q.where.id === id)) {
		queries.push({
			where: { id },
			data: {
				parentDomains: {
					disconnect: [],
					connect: []
				},
				childDomains: {
					disconnect: [],
					connect: []
				}
			}
		})
	}
}


// ----------------> External


/**
 * Creates a Domain object in the database.
 * @param graph_id ID of the Graph object to which the Domain object belongs
 * @returns ID of the created Domain object
 */

async function create(graph_id: number): Promise<number> {
	const domain = await prisma.domain.create({
		data: {
			graph: {
				connect: {
					id: graph_id
				}
			}
		}
	})

	return domain.id
}

/**
 * Removes a Domain object from the database.
 * @param domain_id ID of the Domain object to remove
 * @returns void
 */

async function remove(domain_id: number): Promise<void> {
	await prisma.domain.delete({
		where: {
			id: domain_id
		}
	})
}

/**
 * Sets the x-coordinate of a Domain object.
 * @param domain_id ID of the Domain object to update
 * @param x new x-coordinate of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setX(domain_id: number, x: number): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domain_id
		},
		data: {
			x
		}
	})
}

/**
 * Sets the y-coordinate of a Domain object.
 * @param domain_id ID of the Domain object to update
 * @param y new y-coordinate of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setY(domain_id: number, y: number): Promise<void> {
	
	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domain_id
		},
		data: {
			y
		}
	})
}

/**
 * Updates the name of a Domain object.
 * @param domain_id ID of the Domain object to update
 * @param name new name of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setName(domain_id: number, name?: string): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
		await prisma.domain.update({
		where: {
			id: domain_id
		},
		data: {
			name
		}
	})
}

/**
 * Updates the style of a Domain object.
 * @param domain_id ID of the Domain object to update
 * @param style new style of the Domain object
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setStyle(domain_id: number, style?: string): Promise<void> {

	// Check if the Domain object exists
	const domain = await prisma.domain.findUnique({
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Update
	await prisma.domain.update({
		where: {
			id: domain_id
		},
		data: {
			style
		}
	})
}

/**
 * Sets the parents of a Domain object.
 * Programmed to minimize queries.
 * @param domain_id ID of the Domain object to update
 * @param parent_ids ids of the parent Domain objects
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setParents(domain_id: number, parent_ids: number[]): Promise<void> {
	const domain = await prisma.domain.findUnique({
		include: {
			parentDomains: true,
			childDomains: true
		},
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Build queries
	const queries: RelationalQuery[] = []

	// Remove old parents
	for (const parent of domain.parentDomains) {
		if (!parent_ids.includes(parent.id)) { 
			ensureQueryExists(queries, domain_id)
			queries.find(q => q.where.id === domain_id)!
				.data.parentDomains.disconnect.push({ id: parent.id })
			
			ensureQueryExists(queries, parent.id)
			queries.find(q => q.where.id === parent.id)!
				.data.childDomains.disconnect.push({ id: domain_id })
		}
	}

	// Add new parents
	for (const parent_id of parent_ids) {
		if (!domain.parentDomains.some(d => d.id === parent_id)) {
			const parent = await prisma.domain.findUnique({
				where: {
					id: parent_id
				}
			})

			if (!parent) return Promise.reject('Domain not found')

			ensureQueryExists(queries, domain_id)
			queries.find(q => q.where.id === domain_id)!
				.data.parentDomains.connect.push({ id: parent_id })
			
			ensureQueryExists(queries, parent_id)
			queries.find(q => q.where.id === parent_id)!
				.data.childDomains.connect.push({ id: domain_id })
		}
	}

	// Execute queries
	for (const query of queries) {
		await prisma.domain.update(query)
	}
}

/**
 * Sets the children of a Domain object.
 * Programmed to minimize queries.
 * @param domain_id ID of the Domain object to update
 * @param child_ids ids of the child Domain objects
 * @returns void
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setChildren(domain_id: number, child_ids: number[]): Promise<void> {
	const domain = await prisma.domain.findUnique({
		include: {
			parentDomains: true,
			childDomains: true
		},
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	// Build queries
	const queries: RelationalQuery[] = []

	// Remove old children
	for (const child of domain.childDomains) {
		if (!child_ids.includes(child.id)) { 
			ensureQueryExists(queries, domain_id)
			queries.find(q => q.where.id === domain_id)!
				.data.childDomains.disconnect.push({ id: child.id })
			
			ensureQueryExists(queries, child.id)
			queries.find(q => q.where.id === child.id)!
				.data.parentDomains.disconnect.push({ id: domain_id })
		}
	}

	// Add new children
	for (const child_id of child_ids) {
		if (!domain.childDomains.some(d => d.id === child_id)) {
			const child = await prisma.domain.findUnique({
				where: {
					id: child_id
				}
			})

			if (!child) return Promise.reject('Domain not found')

			ensureQueryExists(queries, domain_id)
			queries.find(q => q.where.id === domain_id)!
				.data.childDomains.connect.push({ id: child_id })
			
			ensureQueryExists(queries, child_id)
			queries.find(q => q.where.id === child_id)!
				.data.parentDomains.connect.push({ id: domain_id })
		}
	}

	// Execute queries
	for (const query of queries) {
		await prisma.domain.update(query)
	}
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