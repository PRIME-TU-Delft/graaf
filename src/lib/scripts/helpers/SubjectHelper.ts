
// External dependencies
import prisma from '$lib/server/prisma'
import type { Subject as PrismaSubject } from '@prisma/client'

// Internal dependencies
import {
	prismaUpdateArray,
	prismaUpdateOptionalField,
	prismaUpdateRequiredField
} from '$scripts/utility'

import {
	GraphHelper,
	DomainHelper,
	LectureHelper
} from '$scripts/helpers'

import type {
	GraphRelation,
	DomainRelation,
	SubjectRelation,
	LectureRelation
} from '$scripts/types'

import type {
	SerializedGraph,
	SerializedDomain,
	SerializedSubject,
	SerializedLecture
} from '$scripts/types'


// --------------------> Helper Functions


export async function reduce(subject: PrismaSubject, ...relations: SubjectRelation[]): Promise<SerializedSubject> {
	const serialized: SerializedSubject = {
		id: subject.id,
		unchanged: subject.unchanged,
		name: subject.name,
		x: subject.x,
		y: subject.y
	}

	// Fetch relations from database
	try {
		var data = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject.id
			},
			select: {
				parentSubjects: {
					select: {
						id: true
					}
				},
				childSubjects: {
					select: {
						id: true
					}
				},
				lectures: {
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
		serialized.graph_id = subject.graphId
	if (relations.includes('domain'))
		serialized.domain_id = subject.domainId
	if (relations.includes('parents'))
		serialized.parent_ids = data.parentSubjects
			.map(parent => parent.id)
	if (relations.includes('children'))
		serialized.child_ids = data.childSubjects
			.map(child => child.id)
	if (relations.includes('lectures'))
		serialized.lecture_ids = data.lectures
			.map(lecture => lecture.id)

	return serialized
}

export async function create(graph_id: number): Promise<SerializedSubject> {
	try {
		var subject = await prisma.subject.create({
			data: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(subject, 'graph', 'domain', 'parents', 'children', 'lectures')
}

export async function update(data: SerializedSubject) {

	// Get deltas
	const [graph, domain, parents, children, lectures] = await Promise.all([
		getGraph(data.id),
		getDomain(data.id),
		getParents(data.id),
		getChildren(data.id),
		getLectures(data.id)
	])

	const graph_delta = prismaUpdateRequiredField<number, SerializedGraph>(graph, data.graph_id)
	const domain_delta = prismaUpdateOptionalField<number, SerializedDomain>(domain, data.domain_id)
	const parents_delta = prismaUpdateArray<number, SerializedSubject>(parents, data.parent_ids)
	const children_delta = prismaUpdateArray<number, SerializedSubject>(children, data.child_ids)
	const lectures_delta = prismaUpdateArray<number, SerializedLecture>(lectures, data.lecture_ids)

	// Update database
	try {
		await prisma.subject.update({
			where: {
				id: data.id
			},
			data: {
				unchanged: data.unchanged,
				name: data.name,
				x: data.x,
				y: data.y,
				graph: graph_delta,
				domain: domain_delta,
				parentSubjects: parents_delta,
				childSubjects: children_delta,
				lectures: lectures_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function remove(id: number) {
	try {
		await prisma.subject.delete({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function getAll(...relations: SubjectRelation[]): Promise<SerializedSubject[]> {
	try {
		var subjects = await prisma.subject.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		subjects.map(async subject => await reduce(subject, ...relations))
	)
}

export async function getById(id: number, ...relations: SubjectRelation[]): Promise<SerializedSubject> {
	try {
		var subject = await prisma.subject.findUniqueOrThrow({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(subject, ...relations)
}

export async function getGraph(id: number, ...relations: GraphRelation[]): Promise<SerializedGraph> {
	try {
		var data = await prisma.subject.findUniqueOrThrow({
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

export async function getDomain(id: number, ...relations: DomainRelation[]): Promise<SerializedDomain | null> {
	try {
		var data = await prisma.subject.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				domain: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	if (data.domain === null)
		return null
	return await DomainHelper.reduce(data.domain, ...relations)
}

export async function getParents(id: number, ...relations: SubjectRelation[]): Promise<SerializedSubject[]> {
	try {
		var data = await prisma.subject.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				parentSubjects: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.parentSubjects.map(async parent => await reduce(parent, ...relations))
	)
}

export async function getChildren(id: number, ...relations: SubjectRelation[]): Promise<SerializedSubject[]> {
	try {
		var data = await prisma.subject.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				childSubjects: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.childSubjects.map(async child => await reduce(child, ...relations))
	)
}

export async function getLectures(id: number, ...relations: LectureRelation[]): Promise<SerializedLecture[]> {
	try {
		var data = await prisma.subject.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				lectures: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.lectures.map(async lecture => await LectureHelper.reduce(lecture, ...relations))
	)
}