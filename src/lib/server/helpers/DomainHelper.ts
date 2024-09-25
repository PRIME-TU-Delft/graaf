
import prisma from '$lib/server/prisma'

import type { Domain as PrismaDomain } from '@prisma/client'
import type { SerializedDomain } from '$scripts/entities'

export { create, remove, update, reduce, getRelations }

/**
 * Creates a Domain object in the database.
 * @param graph_id ID of the Graph object to which the Domain object belongs
 * @returns ID of the created Domain object
 * @throws 'Failed to create domain' if the Domain object could not be created
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
		return Promise.reject('Failed to create domain')
	}

	return await reduce(domain)
}

/**
 * Removes a Domain object from the database.
 * @param domain_id ID of the Domain object to remove
 * @throws 'Failed to remove domain' if the Domain object could not be removed
 */

async function remove(domain_id: number): Promise<void> {
	try {
		await prisma.domain.delete({
			where: {
				id: domain_id
			}
		})
	} catch (error) {
		return Promise.reject('Failed to remove domain')
	}
}

/**
 * Updates a Domain object in the database.
 * @param data SerializedDomain object
 * @throws 'Domain not found' if the Domain object could not be found
 */

async function update(data: SerializedDomain): Promise<void> {

	// Get current relations
	const { children, parents } = await getRelations(data.id)
		.catch(() => Promise.reject('Domain not found'))

	// Find changes in relations
	const new_parents = data.parents.filter((parent) => !parents.includes(parent))
	const old_parents = parents.filter((parent) => !data.parents.includes(parent))
	const new_children = data.children.filter((child) => !children.includes(child))
	const old_children = children.filter((child) => !data.children.includes(child))
	
	// Update domain
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
				disconnect: old_parents.map((parent) => ({ id: parent }))
			},

			childDomains: {
				connect: new_children.map((child) => ({ id: child })),
				disconnect: old_children.map((child) => ({ id: child }))
			},
		}
	})
}

/**
 * Reduces a PrismaDomain object to a SerializedDomain object.
 * @param domain PrismaDomain object
 * @returns SerializedDomain object
 * @throws 'Domain not found' if the Domain object could not be found
 */

async function reduce(domain: PrismaDomain): Promise<SerializedDomain> {
	const { children, parents } = await getRelations(domain.id)
		.catch(() => Promise.reject('Domain not found'))

	return {
		id: domain.id,
		x: domain.x,
		y: domain.y,
		name: domain.name || undefined,
		style: domain.style || undefined,
		children: children,
		parents: parents
	}
}

/**
 * Retrieves the children and parents of a domain.
 * @param domain_id ID of the domain
 * @returns Object containing the IDs of the children and parents
 * @throws 'Domain not found' if the Domain object could not be found
 */

async function getRelations(domain_id: number): Promise<{ children: number[], parents: number[]}> {
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
		return Promise.reject('Domain not found')
	}

	return {
		children: domain.childDomains.map((domain) => domain.id),
		parents: domain.parentDomains.map((domain) => domain.id)
	}
}