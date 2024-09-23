
import prisma from '$lib/server/prisma'

import type { Lecture as PrismaLecture } from '@prisma/client'
import type { SerializedLecture } from '$scripts/entities'

export { create, remove, setName, setSubjects, makeDTO }


// ----------------> Internal


async function getSubjectIds(lecture: PrismaLecture): Promise<number[]> {
	return (await prisma.subject.findMany({
		where: {
			lectures: {
				some: {
					id: lecture.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(s => s.id)
}


// ----------------> External


/**
 * Creates a Lecture object in the database.
 * @param graph_id ID of the Graph object to which the Lecture object belongs
 * @returns ID of the created Lecture object
 * @throws 'Graph not found' if the Graph object does not exist
 */

async function create(graph_id: number): Promise<number> {

	// Check if the Graph object exists
	const graph = await prisma.graph.findUnique({
		where: {
			id: graph_id
		}
	})

	if (!graph) return Promise.reject('Graph not found')

	// Create
	const lecture = await prisma.lecture.create({
		data: {
			graph: {
				connect: {
					id: graph_id
				}
			}
		}
	})

	return lecture.id
}

/**
 * Removes a Lecture object from the database.
 * @param lecture_id ID of the Lecture object to remove
 * @returns void
 * @throws 'Lecture not found' if the Lecture object does not exist
 */

async function remove(lecture_id: number): Promise<void> {

	// Check if the Lecture object exists
	const lecture = await prisma.lecture.findUnique({
		where: {
			id: lecture_id
		}
	})

	if (!lecture) return Promise.reject('Lecture not found')

	// Remove
	await prisma.lecture.delete({
		where: {
			id: lecture_id
		}
	})
}

/**
 * Updates the name of a Lecture object.
 * @param lecture_id ID of the Lecture object to update
 * @param name new name of the Lecture object
 * @returns void
 * @throws 'Lecture not found' if the Lecture object does not exist
 */

async function setName(lecture_id: number, name?: string): Promise<void> {

	// Check if the Lecture object exists
	const lecture = await prisma.lecture.findUnique({
		where: {
			id: lecture_id
		}
	})

	if (!lecture) return Promise.reject('Lecture not found')

	// Update
	await prisma.lecture.update({
		where: {
			id: lecture_id
		},
		data: {
			name
		}
	})
}

/**
 * Updates the subjects of a Lecture object.
 * @param lecture_id ID of the Lecture object to update
 * @param subjects new subjects of the Lecture object
 * @returns void
 * @throws 'Lecture not found' if the Lecture object does not exist
 * @throws 'Subject not found' if a Subject object does not exist
 */

async function setSubjects(lecture_id: number, subjects: number[]): Promise<void> {
	
	// Check if the Lecture object exists
	const lecture = await prisma.lecture.findUnique({
		include: {
			subjects: true
		},
		where: {
			id: lecture_id
		}
	})

	if (!lecture) return Promise.reject('Lecture not found')

	// Find subjects to connect and disconnect
	const old_subjects = lecture.subjects
		.filter(subject => !subjects.includes(subject.id))
		.map(subject => subject.id)
	const new_subjects = subjects
		.filter(id => !lecture.subjects.some(subject => subject.id === id))

	// Check if new subjects exist
	for (const id of new_subjects) {
		const subject = await prisma.subject.findUnique({
			where: { id }
		})

		if (!subject) return Promise.reject('Subject not found')
	}

	// Update
	await prisma.lecture.update({
		where: {
			id: lecture_id
		},
		data: {
			subjects: {
				connect: new_subjects.map(id => ({ id })),
				disconnect: old_subjects.map(id => ({ id }))
			}
		}
	})
}

/**
 * Converts a Lecture object to a DTO.
 * @param lecture prisma Lecture object
 * @returns serialized Lecture object
 */

async function makeDTO(lecture: PrismaLecture): Promise<SerializedLecture> {
	return {
		id: lecture.id,
		name: lecture.name!,
		subjects: await getSubjectIds(lecture)
	}
}