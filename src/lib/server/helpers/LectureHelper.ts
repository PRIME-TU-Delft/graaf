
import prisma from '$lib/server/prisma'

import type { Lecture as PrismaLecture } from '@prisma/client'
import type { SerializedLecture } from '$scripts/entities'

export { create, remove, update, reduce }


/**
 * Creates a Lecture object in the database.
 * @param graph_id ID of the Graph object to which the Lecture object belongs
 * @returns Serialized Lecture object
 * @throws 'Failed to create lecture' if the Lecture object could not be created
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
 * Removes a Lecture object from the database.
 * @param lecture_id ID of the Lecture object to remove
 * @throws 'Failed to remove lecture' if the Lecture object could not be removed
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
 * Updates a Lecture object in the database.
 * @param data SerializedLecture object
 * @throws 'Lecture not found' if the Lecture object could not be found
 * @throws 'Failed to update lecture' if the Lecture object could not be updated
 */

async function update(data: SerializedLecture): Promise<void> {

	// Get current subjects
	const subjects = await getSubjects(data.id)
		.catch(() => Promise.reject('Lecture not found'))

	// Find changes in subjects
	const new_subjects = data.subjects.filter(subject => !subjects.includes(subject))
	const old_subjects = subjects.filter(subject => !data.subjects.includes(subject))

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
					disconnect: old_subjects.map(subject => ({ id: subject }))
				}
			}
		})
	} catch (error) {
		return Promise.reject('Failed to update lecture')
	}
}

/**
 * Reduces a Prisma Lecture object to a Serialized Lecture object.
 * @param lecture Prisma Lecture object
 * @returns Serialized Lecture object
 * @throws 'Lecture not found' if the Lecture object could not be found
 */

async function reduce(lecture: PrismaLecture): Promise<SerializedLecture> {
	const subjects = await getSubjects(lecture.id)
		.catch(() => Promise.reject('Lecture not found'))

	return {
		id: lecture.id,
		name: lecture.name || undefined,
		subjects: subjects
	}
}

/**
 * Gets the subjects of a Lecture object.
 * @param lecture_id ID of the Lecture object
 * @returns Array of subject IDs
 * @throws 'Lecture not found' if the Lecture object could not be found
 */

async function getSubjects(lecture_id: number): Promise<number[]> {
	try {
		var lecture = await prisma.lecture.findUniqueOrThrow({
			where: {
				id: lecture_id
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
		return Promise.reject('Lecture not found')
	}

	return lecture.subjects.map(subject => subject.id)
}
