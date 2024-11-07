
// External dependencies
import prisma from '$lib/server/prisma'
import type { Lecture as PrismaLecture } from '@prisma/client'

// Internal dependencies
import { array_delta, required_field_delta } from './delta'

import {
	GraphHelper,
	SubjectHelper
} from '$scripts/helpers'

import type {
	SerializedLecture,
	SerializedGraph,
	SerializedSubject
} from '$scripts/types'

// Exports
export {
	create,		 // api/lecture				  POST
	remove,		 // api/lecture/[id]		  DELETE
	update,		 // api/lecture				  PUT
	reduce,
	getAll,		 // api/lecture				  GET
	getById,	 // api/lecture/[id]		  GET
	getGraph,	 // api/lecture/[id]/graph	  GET
	getSubjects	 // api/lecture/[id]/subjects GET
}


// --------------------> Helper Functions


/**
 * Creates a Lecture object in the database
 * @param graph_id ID of the Graph to which the Lecture belongs
 * @returns SerializedLecture object
 */

async function create(graph_id: number): Promise<SerializedLecture> {
	try {
		var lecture = await prisma.lecture.create({
			data: {
				graph: {
					connect: {
						id: graph_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject('Failed to create lecture')
	}

	return await reduce(lecture)
}

/**
 * Removes a Lecture from the database.
 * @param lecture_id ID of the Lecture to remove
 */

async function remove(lecture_id: number): Promise<void> {
	try {
		await prisma.lecture.delete({
			where: {
				id: lecture_id
			}
		})
	} catch (error) {
		return Promise.reject('Failed to remove subject')
	}
}

/**
 * Updates a Lecture in the database.
 * @param data SerializedLecture object
 */

async function update(data: SerializedLecture): Promise<void> {

	// Get current data
	const [graph, subjects] = await Promise.all([
		getGraph(data.id),
		getSubjects(data.id)
	])

	// Get data delta
	const graph_delta = required_field_delta(graph, data.graph)
	const subject_delta = array_delta(subjects, data.subjects)

	// Update lecture
	try {
		await prisma.lecture.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				graph: graph_delta,
				subjects: subject_delta
			}
		})
	} catch (error) {
		return Promise.reject('Failed to update lecture')
	}
}

/**
 * Reduces a PrismaLecture to a SerializedLecture
 * @param lecture PrismaLecture object
 * @returns SerializedLecture object
 */

async function reduce(lecture: PrismaLecture): Promise<SerializedLecture> {

	// Get additional data
	try {
		var data = await prisma.lecture.findUniqueOrThrow({
			where: {
				id: lecture.id
			},
			include: {
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

	// Parse data
	const subjects = data.subjects
		.map(subject => subject.id)

	return {
		id: lecture.id,
		name: lecture.name,
		graph: lecture.graphId,
		subjects
	}
}

/**
 * Gets all Lectures in the database
 * @returns Array of SerializedLecture objects
 */

async function getAll(): Promise<SerializedLecture[]> {
	try {
		var lectures = await prisma.lecture.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return Promise.all(lectures.map(reduce))
}

/**
 * Gets a Lecture by ID
 * @param lecture_id ID of the Lecture
 * @returns SerializedLecture object
 */

async function getById(lecture_id: number): Promise<SerializedLecture> {
	try {
		var lecture = await prisma.lecture.findUniqueOrThrow({
			where: {
				id: lecture_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(lecture)
}

/**
 * Gets the Graph of a Lecture
 * @param lecture_id ID of the Lecture
 * @returns SerializedGraph object
 */

async function getGraph(lecture_id: number): Promise<SerializedGraph> {
	try {
		var lecture = await prisma.lecture.findUniqueOrThrow({
			where: {
				id: lecture_id
			},
			select: {
				graph: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await GraphHelper.reduce(lecture.graph)
}

/**
 * Gets the Subjects of a Lecture
 * @param lecture_id ID of the Lecture
 * @returns Array of SerializedSubject objects
 */

async function getSubjects(lecture_id: number): Promise<SerializedSubject[]> {
	try {
		var lecture = await prisma.lecture.findUniqueOrThrow({
			where: {
				id: lecture_id
			},
			select: {
				subjects: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(lecture.subjects.map(SubjectHelper.reduce))
}
