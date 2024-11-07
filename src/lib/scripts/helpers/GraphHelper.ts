
// External dependencies
import prisma from '$lib/server/prisma'
import type { Graph as PrismaGraph } from '@prisma/client'

// Internal dependencies
import { array_delta, required_field_delta } from './delta'

import {
	CourseHelper,
	DomainHelper,
	SubjectHelper,
	LectureHelper,
	LinkHelper
} from '$scripts/helpers'

import type {
	SerializedGraph,
	SerializedCourse,
	SerializedDomain,
	SerializedSubject,
	SerializedLecture,
	SerializedLink
} from '$scripts/types'

// Exports
export {
	create,		 // api/graph				POST
	update,		 // api/graph				PUT
	remove,		 // api/graph/[id]			DELETE
	reduce,
	getAll,		 // api/graph				GET
	getById,	 // api/graph/[id]			GET
	getCourse,	 // api/graph/[id]/course	GET
	getDomains,	 // api/graph/[id]/domains	GET
	getSubjects, // api/graph/[id]/subjects	GET
	getLectures, // api/graph/[id]/lectures	GET
	getLinks	 // api/graph/[id]/links	GET
}


// --------------------> Helper Functions


/**
 * Creates a Graph in the database
 * @param course_id Course ID graph belongs to
 * @param name Graph name
 * @returns Serialized new Graph
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
 * Updates a Graph in the database
 * @param data New Graph data
 */

async function update(data: SerializedGraph): Promise<void> {

	// Get current data
	const [course, domains, subjects, lectures, links] = await Promise.all([
		getCourse(data.id),
		getDomains(data.id),
		getSubjects(data.id),
		getLectures(data.id),
		getLinks(data.id)
	])

	// Get data delta
	const course_delta = required_field_delta(course, data.course)
	const domain_delta = array_delta(domains, data.domains)
	const subject_delta = array_delta(subjects, data.subjects)
	const lecture_delta = array_delta(lectures, data.lectures)
	const link_delta = array_delta(links, data.links)

	// Update
	try {
		await prisma.graph.update({
			where: {
				id: data.id,
			},
			data: {
				name: data.name,
				course: course_delta,
				domains: domain_delta,
				subjects: subject_delta,
				lectures: lecture_delta,
				links: link_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Removes a Graph from the database
 * @param graph_id Target Graph ID
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
 * Reduces a Graph to a SerializedGraph
 * @param graph Graph object
 * @returns Serialized Graph
 */

async function reduce(graph: PrismaGraph): Promise<SerializedGraph> {

	// Get aditional data
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: {
				id: graph.id
			},
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
				},
				links: {
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

	const links = data.links
		.map(link => link.id)

	// Return reduced data
	return {
		id: data.id,
		name: data.name,
		course: data.courseId,
		domains, subjects, lectures, links
	}
}

/**
 * Retrieves all Graphs from the database
 * @returns Array of Serialized Graphs
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
 * Retrieves Graphs by ID
 * @param group_id Target Graph ID
 * @returns Serialized Graph
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
 * Retrieves Course assigned to target Graph
 * @param graph_id Target Graph ID
 * @returns Serialized Course
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
 * Retrieves Domains assigned to target Graph
 * @param graph_id Target Graph ID
 * @returns Serialized Graphs
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
 * Retrieves Subjects assigned to target Graph.
 * @param graph_id Target Graph ID
 * @returns Serialized Subjects
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
 * Retrieves Lectures assigned to target Graph
 * @param graph_id Target Graph ID
 * @returns Serialized Lectures
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

/**
 * Retrieves Links assigned to target Graph
 * @param graph_id Target Graph ID
 * @returns Serialized Links
 */

async function getLinks(graph_id: number): Promise<SerializedLink[]> {
	try {
		var data = await prisma.graphLink.findMany({
			where: {
				graphId: graph_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(data.map(LinkHelper.reduce))
}