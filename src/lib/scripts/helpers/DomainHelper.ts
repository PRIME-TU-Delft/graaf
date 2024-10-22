
// External dependencies
import prisma from '$lib/server/prisma'
import type { Domain as PrismaDomain } from '@prisma/client'

// Internal dependencies
import { array_delta, required_field_delta } from './delta'

import {
	GraphHelper,
	SubjectHelper
 } from '$scripts/helpers'

import type {
	SerializedGraph,
	SerializedDomain,
	SerializedSubject
} from '$scripts/types'

// Exports
export {
	create,		 // api/domain				 POST
	remove,		 // api/domain/[id]			 DELETE
	update,		 // api/domain				 PUT
	reduce,
	getAll,		 // api/domain				 GET
	getById,	 // api/domain/[id]			 GET
	getGraph,	 // api/domain/[id]/graph	 GET
	getParents,	 // api/domain/[id]/parents	 GET
	getChildren, // api/domain/[id]/children GET
	getSubjects	 // api/domain/[id]/subjects GET
}


// --------------------> Helper Functions


/**
 * Creates a Domain object in the database
 * @param graph_id ID of the Graph to which the Domain belongs
 * @returns Serialized Domain
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
 * Updates a Domain in the database
 * @param data Serialized Domain
 */

async function update(data: SerializedDomain): Promise<void> {

	// Get current data
	const [graph, parents, children] = await Promise.all([
		getGraph(data.id),
		getParents(data.id),
		getChildren(data.id)
	])

	// Get data delta
	const graph_delta = required_field_delta(data.graph, graph)
	const parent_delta = array_delta(data.parents, parents)
	const child_delta = array_delta(data.children, children)

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
				graph: graph_delta,
				parentDomains: parent_delta,
				childDomains: child_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Removes a Domain from the database
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
 * Reduces a Domain to a SerializedDomain
 * @param domain Prisma Domain
 * @returns Serialized Domain
 */

async function reduce(domain: PrismaDomain): Promise<SerializedDomain> {

	// Get aditional data
	try {
		var data = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain.id
			},
			include: {
				parentDomains: {
					select: {
						id: true
					}
				},
				childDomains: {
					select: {
						id: true
					}
				}
			}
		})

		var subject_data = await prisma.subject.findMany({
			where: {
				domainId: domain.id
			},
			select: {
				id: true
			}
		})

	} catch (error) {
		return Promise.reject(error)
	}

	// Parse data
	const parents = data.parentDomains
		.map(domain => domain.id)
	const children = data.childDomains
		.map(domain => domain.id)
	const subjects = subject_data
		.map(subject => subject.id)

	// Return reduced data
	return {
		graph: domain.graphId,
		id: data.id,
		x: data.x,
		y: data.y,
		name: data.name,
		style: data.style,
		parents,
		children,
		subjects
	}
}

/**
 * Retrieves all Domains from the database
 * @returns Array of serialized Domains
 */

async function getAll(): Promise<SerializedDomain[]> {
	try {
		var domains = await prisma.domain.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(domains.map(reduce))
}

/**
 * Retrieves a Domain by ID
 * @param domain_id ID of the Domain to retrieve
 * @returns Serialized Domain
 */

async function getById(domain_id: number): Promise<SerializedDomain> {
	try {
		var domain = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(domain)
}

/**
 * Get Graph this Domain belongs to
 * @param domain_id ID of the Domain
 * @returns Serialized Graph
 */

async function getGraph(domain_id: number): Promise<SerializedGraph> {
	try {
		var graph = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain_id
			},
			select: {
				graph: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await GraphHelper.reduce(graph.graph)
}

/**
 * Get all parents of a Domain
 * @param domain_id ID of the Domain
 * @returns Array of serialized Domains
 */

async function getParents(domain_id: number): Promise<SerializedDomain[]> {
	try {
		var parents = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain_id
			},
			select: {
				parentDomains: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(parents.parentDomains.map(reduce))
}

/**
 * Get all children of a Domain
 * @param domain_id ID of the Domain
 * @returns Array of serialized Domains
 */

async function getChildren(domain_id: number): Promise<SerializedDomain[]> {
	try {
		var children = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain_id
			},
			select: {
				childDomains: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(children.childDomains.map(reduce))
}

/**
 * Get all subjects of a Domain
 * @param domain_id ID of the Domain
 * @returns Array of serialized Subjects
 */

async function getSubjects(domain_id: number): Promise<SerializedSubject[]> {
	try {
		var subjects = await prisma.subject.findMany({
			where: {
				domainId: domain_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(subjects.map(SubjectHelper.reduce))
}