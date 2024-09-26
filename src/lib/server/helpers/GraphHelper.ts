
import prisma from '$lib/server/prisma'

import { DomainHelper, SubjectHelper, LectureHelper } from '.'

import type { SerializedGraph } from '$scripts/entities'
import type { 
	Graph as PrismaGraph, 
	Domain as PrismaDomain, 
	Subject as PrismaSubject, 
	Lecture as PrismaLecture 
} from '@prisma/client'

export { create, remove, reduce, getByCourseCode, getById }

/**
 * Retrieves all Graphs associated with a Course.
 * @param course_code 
 * @returns Array of SerializedGraph objects
 */

async function getByCourseCode(course_code: string): Promise<SerializedGraph[]> {
	const graphs = await prisma.graph.findMany({
		where: {
			course: {
				code: course_code
			}
		}
	})

	return await Promise.all(graphs.map(reduce))
}

/**
 * Retrieves a Graph by its ID.
 * @param graph_id
 * @returns SerializedGraph object
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
 * Creates a Graph object in the database.
 * @param course_code The code of the Course to which the Graph belongs
 * @param name The name of the Graph
 * @returns SerializedGraph object
 */

async function create(course_code: string, name: string): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.create({
			data: {
				name,
				course: {
					connect: {
						code: course_code
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
 * @param graph_id ID of the Graph to remove
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
 * Reduces a Graph to a SerializedGraph.
 * @param graph PrismaGraph object
 * @returns SerializedGraph object
 */

async function reduce(graph: PrismaGraph): Promise<SerializedGraph> {
	const domains = await Promise.all((await getDomains(graph.id)).map(DomainHelper.reduce))
	const subjects = await Promise.all((await getSubjects(graph.id)).map(SubjectHelper.reduce))
	const lectures = await Promise.all((await getLectures(graph.id)).map(LectureHelper.reduce))

	return {
		id: graph.id,
		name: graph.name,
		domains: domains,
		subjects: subjects,
		lectures: lectures
	}
}

/**
 * Retrieves PrismaDomains associated with a Graph.
 * @param graph_id ID of the Graph
 * @returns Array of PrismaDomains
 */

async function getDomains(graph_id: number): Promise<PrismaDomain[]> {
	try {
		return await prisma.domain.findMany({
			where: {
				graphId: graph_id
			},
			orderBy: {
				id: 'asc'
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Retrieves PrismaSubjects associated with a Graph.
 * @param graph_id ID of the Graph
 * @returns Array of PrismaSubjects
 */

async function getSubjects(graph_id: number): Promise<PrismaSubject[]> {
	try {
		return await prisma.subject.findMany({
			where: {
				graphId: graph_id
			},
			orderBy: {
				id: 'asc'
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Retrieves PrismaLectures associated with a Graph.
 * @param graph_id ID of the Graph
 * @returns Array of PrismaLectures
 */

async function getLectures(graph_id: number): Promise<PrismaLecture[]> {
	try {
		return await prisma.lecture.findMany({
			where: {
				graphId: graph_id
			},
			orderBy: {
				id: 'asc'
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}
