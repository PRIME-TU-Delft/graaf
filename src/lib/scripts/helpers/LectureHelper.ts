
// External dependencies
import prisma from '$lib/server/prisma'
import type { Lecture as PrismaLecture } from '@prisma/client'

// Internal dependencies
import { prismaUpdateArray, prismaUpdateRequiredField } from '$scripts/utility'

import {
	GraphHelper,
	SubjectHelper
} from '$scripts/helpers'

import type {
	GraphRelation,
	SubjectRelation,
	LectureRelation
} from '$scripts/types'

import type {
	SerializedGraph,
	SerializedSubject,
	SerializedLecture
} from '$scripts/types'


// --------------------> Helper Functions


export async function reduce(lecture: PrismaLecture, ...relations: LectureRelation[]): Promise<SerializedLecture> {
	const serialized: SerializedLecture = {
		id: lecture.id,
		name: lecture.name,
		order: lecture.order
	}

	// Fetch relations from database
	try {
		var data = await prisma.lecture.findUniqueOrThrow({
			where: {
				id: lecture.id
			},
			select: {
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
		serialized.graph_id = lecture.graphId
	if (relations.includes('subjects'))
		serialized.subject_ids = data.subjects
			.map(subject => subject.id)

	return serialized
}

export async function create(graph_id: number, order: number): Promise<SerializedLecture> {
	try {
		var lecture = await prisma.lecture.create({
			data: {
				graphId: graph_id,
				order: order
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(lecture, 'graph', 'subjects')
}

export async function update(data: SerializedLecture) {

	// Get deltas
	const [graph, subjects] = await Promise.all([
		getGraph(data.id),
		getSubjects(data.id)
	])

	const graph_delta = prismaUpdateRequiredField<number, SerializedGraph>(graph, data.graph_id)
	const subject_delta = prismaUpdateArray<number, SerializedSubject>(subjects, data.subject_ids)

	// Update database
	try {
		await prisma.lecture.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				order: data.order,
				graph: graph_delta,
				subjects: subject_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function remove(id: number) {
	try {
		await prisma.lecture.delete({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function getAll(...relations: LectureRelation[]): Promise<SerializedLecture[]> {
	try {
		var lectures = await prisma.lecture.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		lectures.map(async lecture => await reduce(lecture, ...relations))
	)
}

export async function getById(id: number, ...relations: LectureRelation[]): Promise<SerializedLecture> {
	try {
		var lecture = await prisma.lecture.findUniqueOrThrow({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(lecture, ...relations)
}

export async function getGraph(id: number, ...relations: GraphRelation[]): Promise<SerializedGraph> {
	try {
		var data = await prisma.lecture.findUniqueOrThrow({
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

export async function getSubjects(id: number, ...relations: SubjectRelation[]): Promise<SerializedSubject[]> {
	try {
		var data = await prisma.lecture.findUniqueOrThrow({
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