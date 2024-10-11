
// External imports
import prisma from '$lib/server/prisma'
import type { Graph as PrismaGraph } from '@prisma/client'

// Internal imports
import {
	CourseHelper,
	DomainHelper,
	SubjectHelper,
	LectureHelper
} from '$scripts/helpers'

import type {
	SerializedGraph,
	SerializedCourse,
	SerializedDomain,
	SerializedSubject,
	SerializedLecture
} from '$scripts/types'

// Exports
export { create, remove, update, reduce, getAll, getById, getCourse, getDomains, getSubjects, getLectures }


// --------------------> Helper Functions


/**
 * Creates a Graph object in the database.
 * @param course_id `number`
 * @param name `string`
 * @returns `SerializedGraph`
 */

async function create(course_id: number, name: string): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.create({
			data: {
				name,
				course: {
					connect: {
						id: course_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(graph)
}

/**
 * Removes a Graph from the database.
 * @param graph_id `number`
 */

async function remove(graph_id: number): Promise<void> {
	try {
		await prisma.graph.delete({
			where: {
				id: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Graph in the database.
 * @param data 'SerializedGraph'
 */

async function update(data: SerializedGraph): Promise<void> {

	// Get old and new domains
	const domains = await getDomains(data.id)
	const old_domains = domains
		.filter(domain => !data.domains.includes(domain.id))
		.map(domain => ({ id: domain.id }))
	const new_domains = data.domains
		.filter(id => !domains.some(domain => domain.id === id))
		.map(id => ({ id }))

	// Get old and new subjects
	const subjects = await getSubjects(data.id)
	const old_subjects = subjects
		.filter(subject => !data.subjects.includes(subject.id))
		.map(subject => ({ id: subject.id }))
	const new_subjects = data.subjects
		.filter(id => !subjects.some(subject => subject.id === id))
		.map(id => ({ id }))

	// Get old and new lectures
	const lectures = await getLectures(data.id)
	const old_lectures = lectures
		.filter(lecture => !data.lectures.includes(lecture.id))
		.map(lecture => ({ id: lecture.id }))
	const new_lectures = data.lectures
		.filter(id => !lectures.some(lecture => lecture.id === id))
		.map(id => ({ id }))

	// Get course connection data
	const course = await getCourse(data.id)
	const course_data = course.id === data.course ? {} : {
		connect : { id: data.course },
		disconnect : { id: course.id }
	}

	// Update
	try {
		await prisma.graph.update({
			where: {
				id: data.id,
			},
			data: {
				name: data.name,
				course: course_data,
				domains: {
					connect: new_domains,
					disconnect: old_domains
				},
				subjects: {
					connect: new_subjects,
					disconnect: old_subjects
				},
				lectures: {
					connect: new_lectures,
					disconnect: old_lectures
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a Graph to a SerializedGraph.
 * @param graph `PrismaGraph`
 * @returns `SerializedGraph`
 */

async function reduce(graph: PrismaGraph): Promise<SerializedGraph> {

	// Get aditional data
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: { id: graph.id },
			include: {
				domains: {
					select: {
						id: true
					}
				},
				subjects: {
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

	// Parse data
	const domains = data.domains
		.map(domain => domain.id)
	const subjects = data.subjects
		.map(subject => subject.id)
	const lectures = data.lectures
		.map(lecture => lecture.id)

	// Return reduced data
	return {
		id: data.id,
		name: data.name,
		course: data.courseId,
		domains, subjects, lectures
	}
}

/**
 * Retrieves all Graphs from the database.
 * @returns `SerializedGraph[]`
 */

async function getAll(): Promise<SerializedGraph[]> {
	try {
		var graphs = await prisma.graph.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(graphs.map(reduce))
}

/**
 * Retrieves Groups by ID
 * @param group_id `number`
 * @returns `SerializedGraph`
 */

async function getById(graph_id: number): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.findUniqueOrThrow({
			where: {
				id: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(graph)
}

/**
 * Retrieves Graph course.
 * @param graph_id `number`
 * @returns `SerializedCourse`
 */

async function getCourse(graph_id: number): Promise<SerializedCourse> {
	try {
		var data = await prisma.course.findFirstOrThrow({
			where: {
				graphs: {
					some: {
						id: graph_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await CourseHelper.reduce(data)
}

/**
 * Retrieves Graph domains.
 * @param graph_id `number`
 * @returns `SerializedGraph[]`
 */

async function getDomains(graph_id: number): Promise<SerializedDomain[]> {
	try {
		var data = await prisma.domain.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(DomainHelper.reduce))
}

/**
 * Retrieves Graph subjects.
 * @param graph_id `number`
 * @returns `SerializedSubject[]`
 */

async function getSubjects(graph_id: number): Promise<SerializedSubject[]> {
	try {
		var subjects = await prisma.subject.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(subjects.map(SubjectHelper.reduce))
}

/**
 * Retrieves Graph lectures.
 * @param graph_id `number`
 * @returns `SerializedLecture[]`
 */

async function getLectures(graph_id: number): Promise<SerializedLecture[]> {
	try {
		var lectures = await prisma.lecture.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(lectures.map(LectureHelper.reduce))
}