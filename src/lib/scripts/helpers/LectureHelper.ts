
// External imports
import prisma from '$lib/server/prisma'
import type {
	Lecture as PrismaLecture,
	Subject as PrismaSubject
} from '@prisma/client'

// Internal imports
import type { SerializedLecture } from '$scripts/types'

// Exports
export { create, remove, update, reduce, getByGraphId }


// --------------------> Helper Functions


/**
 * Retrieves all Lecture objects associated with a Graph.
 * @param graph_id ID of the Graph
 * @returns Array of Serialized Lecture objects
 */

async function getByGraphId(graph_id: number): Promise<SerializedLecture[]> {
	try {
		var lectures = await prisma.lecture.findMany({
			where: {
				graph: {
					id: graph_id
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(lectures.map(reduce))
}

/**
 * Creates a Lecture object in the database.
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

	// Get current subjects
	const subjects = await getSubjects(data.id)
		.catch(error => Promise.reject(error))

	// Find changes in subjects
	const new_subjects = data.subjects.filter(id => !subjects.some(subject => subject.id === id))
	const old_subjects = subjects.filter(subject => !data.subjects.includes(subject.id))

	// Update lecture
	try {
		await prisma.lecture.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				subjects: {
					connect: new_subjects.map(subject => ({ id: subject })),
					disconnect: old_subjects.map(subject => ({ id: subject.id }))
				}
			}
		})
	} catch (error) {
		return Promise.reject('Failed to update lecture')
	}
}

/**
 * Reduces a PrismaLecture to a SerializedLecture.
 * @param lecture PrismaLecture object
 * @returns SerializedLecture object
 */

async function reduce(lecture: PrismaLecture): Promise<SerializedLecture> {
	const subjects = await getSubjects(lecture.id)
		.catch(error => Promise.reject(error))

	return {
		id: lecture.id,
		name: lecture.name || undefined,
		subjects: subjects.map(subject => subject.id)
	}
}

/**
 * Gets the subjects of a Lecture.
 * @param lecture_id ID of the Lecture
 * @returns Array of PrismaSubjects
 */

async function getSubjects(lecture_id: number): Promise<PrismaSubject[]> {
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

	return lecture.subjects
}
