
// External dependencies
import prisma from '$lib/server/prisma'
import type { Domain as PrismaDomain } from '@prisma/client'

// Internal dependencies
import { prismaUpdateArray, prismaUpdateRequiredField} from '$scripts/utility'

import {
	GraphHelper,
	SubjectHelper
} from '$scripts/helpers'

import type {
	GraphRelation,
	DomainRelation,
	SubjectRelation
} from '$scripts/types'

import type {
	SerializedGraph,
	SerializedDomain,
	SerializedSubject
} from '$scripts/types'


// --------------------> Helper Functions


export async function reduce(domain: PrismaDomain, ...relations: DomainRelation[]): Promise<SerializedDomain> {
	const serialized: SerializedDomain = {
		id: domain.id,
		name: domain.name,
		style: domain.style,
		ordering: domain.ordering,
		x: domain.x,
		y: domain.y
	}

	// Fetch relations from database
	try {
		var data = await prisma.domain.findUniqueOrThrow({
			where: {
				id: domain.id
			},
			select: {
				parentDomains: {
					select: {
						id: true
					}
				},
				childDomains: {
					select: {
						id: true
					}
				},
				subjects: {
					select: {
						id: true
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	// Add relations if requested
	if (relations.includes('graph'))
		serialized.graph_id = domain.graphId
	if (relations.includes('parents'))
		serialized.parent_ids = data.parentDomains
			.map(parent => parent.id)
	if (relations.includes('children'))
		serialized.child_ids = data.childDomains
			.map(child => child.id)
	if (relations.includes('subjects'))
		serialized.subject_ids = data.subjects
			.map(subject => subject.id)

	return serialized
}

export async function create(graph_id: number): Promise<SerializedDomain> {
	try {
		var domain = await prisma.domain.create({
			data: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(domain, 'graph', 'parents', 'children', 'subjects')
}

export async function update(data: SerializedDomain) {

	// Get deltas
	const [graph, parents, children, subjects] = await Promise.all([
		getGraph(data.id),
		getParents(data.id),
		getChildren(data.id),
		getSubjects(data.id)
	])

	const graph_delta = prismaUpdateRequiredField<number, SerializedGraph>(graph, data.graph_id)
	const parents_delta = prismaUpdateArray<number, SerializedDomain>(parents, data.parent_ids)
	const children_delta = prismaUpdateArray<number, SerializedDomain>(children, data.child_ids)
	const subjects_delta = prismaUpdateArray<number, SerializedSubject>(subjects, data.subject_ids)

	// Update database
	try {
		await prisma.domain.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				style: data.style,
				ordering: data.ordering,
				x: data.x,
				y: data.y,
				graph: graph_delta,
				parentDomains: parents_delta,
				childDomains: children_delta,
				subjects: subjects_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function remove(id: number) {
	try {
		await prisma.domain.delete({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function getAll(...relations: DomainRelation[]): Promise<SerializedDomain[]> {
	try {
		var domains = await prisma.domain.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		domains.map(async domain => await reduce(domain, ...relations))
	)
}

export async function getById(id: number, ...relations: DomainRelation[]): Promise<SerializedDomain> {
	try {
		var domain = await prisma.domain.findUniqueOrThrow({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(domain, ...relations)
}

export async function getGraph(id: number, ...relations: GraphRelation[]): Promise<SerializedGraph> {
	try {
		var data = await prisma.domain.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				graph: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await GraphHelper.reduce(data.graph, ...relations)
}

export async function getParents(id: number, ...relations: DomainRelation[]): Promise<SerializedDomain[]> {
	try {
		var data = await prisma.domain.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				parentDomains: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.parentDomains.map(async parent => await reduce(parent, ...relations))
	)
}

export async function getChildren(id: number, ...relations: DomainRelation[]): Promise<SerializedDomain[]> {
	try {
		var data = await prisma.domain.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				childDomains: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.childDomains.map(async child => await reduce(child, ...relations))
	)
}

export async function getSubjects(id: number, ...relations: SubjectRelation[]): Promise<SerializedSubject[]> {
	try {
		var data = await prisma.domain.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				subjects: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.subjects.map(async subject => await SubjectHelper.reduce(subject, ...relations))
	)
}