
// External dependencies
import prisma from '$lib/server/prisma'
import type { Subject as PrismaSubject } from '@prisma/client'

// Internal dependencies
import { array_delta, required_field_delta, optional_field_delta } from './delta'

import {
	GraphHelper,
	DomainHelper,
	LectureHelper
} from '$scripts/helpers'

import type {
	SerializedGraph,
	SerializedDomain,
	SerializedSubject,
	SerializedLecture
} from '$scripts/types'

// Exports
export {
	create,		 // api/subject				  POST
	remove,		 // api/subject/[id]		  DELETE
	update,		 // api/subject				  PUT
	reduce,
	getAll,		 // api/subject				  GET
	getById,	 // api/subject/[id]		  GET
	getGraph,	 // api/subject/[id]/graph	  GET
	getDomain,	 // api/subject/[id]/domain	  GET
	getParents,	 // api/subject/[id]/parents  GET
	getChildren, // api/subject/[id]/children GET
	getLectures, // api/subject/[id]/lectures GET
}


// --------------------> Helper Functions

/**
 * Creates a Subject object in the database
 * @param graph_id ID of the Graph to which the Subject belongs
 * @returns SerializedSubject object
 */

async function create(graph_id: number): Promise<SerializedSubject> {
	try {
		var subject = await prisma.subject.create({
			data: {
				graph: {
					connect: {
						id: graph_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(subject)
}

/**
 * Removes a Subject from the database
 * @param subject_id ID of the Subject to remove
 */

async function remove(subject_id: number): Promise<void> {
	try {
		await prisma.subject.delete({
			where: {
				id: subject_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Updates a Subject in the database
 * @param data SerializedSubject object
 */

async function update(data: SerializedSubject): Promise<void> {

	// Get current data
	const [graph, domain, parents, children, lectures] = await Promise.all([
		getGraph(data.id),
		getDomain(data.id),
		getParents(data.id),
		getChildren(data.id),
		getLectures(data.id)
	])

	// Get data deltas
	const graph_delta = required_field_delta(graph, data.graph)
	const domain_delta = optional_field_delta(domain, data.domain)
	const parent_delta = array_delta(parents, data.parents)
	const child_delta = array_delta(children, data.children)
	const lecture_delta = array_delta(lectures, data.lectures)

	// Update subject
	try {
		await prisma.subject.update({
			where: {
				id: data.id
			},
			data: {
				x: data.x,
				y: data.y,
				name: data.name,
				graph: graph_delta,
				domain: domain_delta,
				parentSubjects: parent_delta,
				childSubjects: child_delta,
				lectures: lecture_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

/**
 * Reduces a PrismaSubject to a SerializedSubject
 * @param subject PrismaSubject object
 * @returns SerializedSubject object
 */

async function reduce(subject: PrismaSubject): Promise<SerializedSubject> {
	const [children, parents] = await Promise.all([
		getChildren(subject.id),
		getParents(subject.id)
	])

	return {
		id: subject.id,
		x: subject.x,
		y: subject.y,
		name: subject.name,
		domain: subject.domainId,
		children: children.map(subject => subject.id),
		parents: parents.map(subject => subject.id)
	}
}

/**
 * Retrieves all Subjects from the database
 * @returns Array of SerializedSubject objects
 */

async function getAll(): Promise<SerializedSubject[]> {
	try {
		var subjects = await prisma.subject.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(subjects.map(reduce))
}

/**
 * Retrieves a Subject by ID from the database
 * @param subject_id ID of the Subject to retrieve
 * @returns SerializedSubject object
 */

async function getById(subject_id: number): Promise<SerializedSubject> {
	try {
		var subject = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject_id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(subject)
}

/**
 * Retrieves the Graph to which a Subject belongs
 * @param subject_id ID of the Subject
 * @returns SerializedGraph object
 */

async function getGraph(subject_id: number): Promise<SerializedGraph> {
	try {
		var graph = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject_id
			},
			select: {
				graph: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await GraphHelper.reduce(graph.graph)
}

/**
 * Retrieves the Domain to which a Subject belongs
 * @param subject_id ID of the Subject
 * @returns SerializedDomain object
 */

async function getDomain(subject_id: number): Promise<SerializedDomain | null> {
	try {
		var domain = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject_id
			},
			select: {
				domain: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	if (!domain.domain) return null
	return await DomainHelper.reduce(domain.domain)
}

/**
 * Retrieves all parent Subjects of a Subject
 * @param subject_id ID of the Subject
 * @returns Array of SerializedSubject objects
 */

async function getParents(subject_id: number): Promise<SerializedSubject[]> {
	try {
		var parents = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject_id
			},
			select: {
				parentSubjects: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(parents.parentSubjects.map(reduce))
}

/**
 * Retrieves all child Subjects of a Subject
 * @param subject_id ID of the Subject
 * @returns Array of SerializedSubject objects
 */

async function getChildren(subject_id: number): Promise<SerializedSubject[]> {
	try {
		var children = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject_id
			},
			select: {
				childSubjects: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(children.childSubjects.map(reduce))
}

/**
 * Retrieves all Lectures associated with a Subject
 * @param subject_id ID of the Subject
 * @returns Array of SerializedLecture objects
 */

async function getLectures(subject_id: number): Promise<SerializedLecture[]> {
	try {
		var lectures = await prisma.lecture.findMany({
			where: {
				subjects: {
					some: {
						id: subject_id
					}
				}
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(lectures.map(LectureHelper.reduce))
}