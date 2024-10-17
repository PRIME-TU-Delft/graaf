
// External imports
import prisma from '$lib/server/prisma'
import type { Graph as PrismaGraph } from '@prisma/client'

// Internal imports
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
 * Creates a Graph in the database.
 * @param course_id `number` Course ID graph belongs to
 * @param name `string` Graph name
 * @returns `SerializedGraph` Serialized new Graph
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
 * Updates a Graph in the database.
 * @param data 'SerializedGraph' New Graph data
 */

async function update(data: SerializedGraph): Promise<void> {

	// Get course data
	const course = await getCourse(data.id)
	const course_data: { connect?: any, disconnect?: any } = {}
	if (data.course !== course.id)
		course_data.connect = { id: data.course }
	if (data.course !== course.id)
		course_data.disconnect = { id: data.course }

	// Get domain data
	const domains = await getDomains(data.id)
	const old_domains = domains
		.filter(domain => !data.domains.includes(domain.id))
		.map(domain => ({ id: domain.id }))
	const new_domains = data.domains
		.filter(id => !domains.some(domain => domain.id === id))
		.map(id => ({ id }))

	const domain_data: { connect?: any, disconnect?: any } = {}
	if (new_domains.length) domain_data.connect = new_domains
	if (old_domains.length) domain_data.disconnect = old_domains

	// Get subject data
	const subjects = await getSubjects(data.id)
	const old_subjects = subjects
		.filter(subject => !data.subjects.includes(subject.id))
		.map(subject => ({ id: subject.id }))
	const new_subjects = data.subjects
		.filter(id => !subjects.some(subject => subject.id === id))
		.map(id => ({ id }))

	const subject_data: { connect?: any, disconnect?: any } = {}
	if (new_subjects.length) subject_data.connect = new_subjects
	if (old_subjects.length) subject_data.disconnect = old_subjects

	// Get lecture data
	const lectures = await getLectures(data.id)
	const old_lectures = lectures
		.filter(lecture => !data.lectures.includes(lecture.id))
		.map(lecture => ({ id: lecture.id }))
	const new_lectures = data.lectures
		.filter(id => !lectures.some(lecture => lecture.id === id))
		.map(id => ({ id }))

	const lecture_data: { connect?: any, disconnect?: any } = {}
	if (new_lectures.length) lecture_data.connect = new_lectures
	if (old_lectures.length) lecture_data.disconnect = old_lectures

	// Get link data
	const links = await getLinks(data.id)
	const old_links = links
		.filter(link => !data.links.includes(link.id))
		.map(link => ({ id: link.id }))
	const new_links = data.links
		.filter(id => !links.some(link => link.id === id))
		.map(id => ({ id }))

	const link_data: { connect?: any, disconnect?: any } = {}
	if (new_links.length) link_data.connect = new_links
	if (old_links.length) link_data.disconnect = old_links

	// Update
	try {
		await prisma.graph.update({
			where: {
				id: data.id,
			},
			data: {
				name: data.name,
				course: course_data,
				domains: domain_data,
				subjects: subject_data,
				lectures: lecture_data,
				links: link_data
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Removes a Graph from the database.
 * @param graph_id `number` Target Graph ID
 */

async function remove(graph_id: number): Promise<void> {
	try {
		console.log('graph_id', graph_id)
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
 * Reduces a Graph to a SerializedGraph.
 * @param graph `PrismaGraph` Graph object
 * @returns `SerializedGraph` Serialized Graph
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
 * Retrieves all Graphs from the database.
 * @returns `SerializedGraph[]` Array of Serialized Graphs
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
 * @param group_id `number` Target Graph ID
 * @returns `SerializedGraph` Serialized Graph
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
 * Retrieves Course assigned to target Graph.
 * @param graph_id `number` Target Graph ID
 * @returns `SerializedCourse` Serialized Course
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
 * Retrieves Domains assigned to target Graph.
 * @param graph_id `number` Target Graph ID
 * @returns `SerializedGraph[]` Serialized Graphs
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
 * @param graph_id `number` Target Graph ID
 * @returns `SerializedSubject[]` Serialized Subjects
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
 * Retrieves Lectures assigned to target Graph.
 * @param graph_id `number` Target Graph ID
 * @returns `SerializedLecture[]` Serialized Lectures
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
 * Retrieves Links assigned to target Graph.
 * @param graph_id `number` Target Graph ID
 * @returns `SerializedLink[]` Serialized Links
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