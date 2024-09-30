
// External imports
import prisma from '$lib/server/prisma'
import type { Domain as PrismaDomain } from '@prisma/client'

// Internal imports
import type { SerializedDomain } from '$scripts/types'

// Exports
export { create, remove, update, reduce, getByGraphId }


// --------------------> Helper Functions


/**
 * Retrieves all Domain objects associated with a Graph.
 * @param graph_id ID of the Graph
 * @returns Array of Serialized Domain objects
 */

async function getByGraphId(graph_id: number): Promise<SerializedDomain[]> {
	try {
		var domains = await prisma.domain.findMany({
			where: {
				graph: {
					id: graph_id
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(domains.map(reduce))
}

/**
 * Creates a Domain object in the database.
 * @param graph_id ID of the Graph to which the Domain belongs
 * @returns SerializedDomain object
 */

async function create(graph_id: number): Promise<SerializedDomain> {
	try {
		var domain = await prisma.domain.create({
			data: {
				graph: {
					connect: {
						id: graph_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(domain)
}

/**
 * Removes a Domain from the database.
 * @param domain_id ID of the Domain to remove
 */

async function remove(domain_id: number): Promise<void> {
	try {
		await prisma.domain.delete({
			where: {
				id: domain_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Domain in the database.
 * @param data SerializedDomain object
 */

async function update(data: SerializedDomain): Promise<void> {

	// Get current relations
	const { children, parents } = await getRelations(data.id)
		.catch(error => Promise.reject(error))

	// Find changes in relations
	const new_parents = data.parents.filter((parent) => !parents.some((domain) => domain.id === parent))
	const old_parents = parents.filter((parent) => !data.parents.includes(parent.id))
	const new_children = data.children.filter((child) => !children.some((domain) => domain.id === child))
	const old_children = children.filter((child) => !data.children.includes(child.id))

	// Update domain
	try {
		await prisma.domain.update({
			where: {
				id: data.id
			},
			data: {
				x: data.x,
				y: data.y,
				name: data.name,
				style: data.style,

				parentDomains: {
					connect: new_parents.map((parent) => ({ id: parent })),
					disconnect: old_parents.map((parent) => ({ id: parent.id }))
				},

				childDomains: {
					connect: new_children.map((child) => ({ id: child })),
					disconnect: old_children.map((child) => ({ id: child.id }))
				},
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a PrismaDomain to a SerializedDomain.
 * @param domain PrismaDomain object
 * @returns SerializedDomain object
 */

async function reduce(domain: PrismaDomain): Promise<SerializedDomain> {
	const { children, parents } = await getRelations(domain.id)
		.catch(error => Promise.reject(error))

	return {
		id: domain.id,
		x: domain.x,
		y: domain.y,
		name: domain.name || undefined,
		style: domain.style || undefined,
		children: children.map(child => child.id),
		parents: parents.map(parent => parent.id)
	}
}

/**
 * Retrieves the children and parents of a Domain.
 * @param domain_id ID of the Domain
 * @returns Object containing the children and parents
 */

async function getRelations(domain_id: number): Promise<{ children: PrismaDomain[], parents: PrismaDomain[]}> {
	try {
		var domain = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain_id
			},
			include: {
				childDomains: true,
				parentDomains: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return {
		children: domain.childDomains,
		parents: domain.parentDomains
	}
}