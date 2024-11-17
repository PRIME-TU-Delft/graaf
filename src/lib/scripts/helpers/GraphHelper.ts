
// External dependencies
import prisma from '$lib/server/prisma'

import type { Graph as PrismaGraph } from '@prisma/client'

// Internal dependencies
import { prismaUpdateArray, prismaUpdateRequiredField} from '$scripts/utility'

import {
	CourseHelper,
	DomainHelper,
	SubjectHelper,
	LectureHelper,
	LinkHelper
} from '$scripts/helpers'

import type {
	CourseRelation,
	GraphRelation,
	DomainRelation,
	SubjectRelation,
	LectureRelation,
	LinkRelation
} from '$scripts/types'

import type {
	SerializedCourse,
	SerializedGraph,
	SerializedDomain,
	SerializedSubject,
	SerializedLecture,
	SerializedLink
} from '$scripts/types'


// --------------------> Helper Functions


export async function reduce(graph: PrismaGraph, ...relations: GraphRelation[]): Promise<SerializedGraph> {
	const serialized: SerializedGraph = {
		id: graph.id,
		name: graph.name
	}

	// Fetch relations from database
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: {
				id: graph.id
			},
			select: {
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

	// Add relations if requested
	if (relations.includes('course'))
		serialized.course_id = graph.courseId
	if (relations.includes('domains'))
		serialized.domain_ids = data.domains
			.map(domain => domain.id)
	if (relations.includes('subjects'))
		serialized.subject_ids = data.subjects
			.map(subject => subject.id)
	if (relations.includes('lectures'))
		serialized.lecture_ids = data.lectures
			.map(lecture => lecture.id)
	if (relations.includes('links'))
		serialized.link_ids = data.links
			.map(link => link.id)

	return serialized
}

export async function create(course_id: number, name: string): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.create({
			data: {
				courseId: course_id,
				name
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(graph, 'course', 'domains', 'subjects', 'lectures', 'links')
}

export async function update(data: SerializedGraph) {

	// Get deltas
	const [course, domains, subjects, lectures, links] = await Promise.all([
		getCourse(data.id),
		getDomains(data.id),
		getSubjects(data.id),
		getLectures(data.id),
		getLinks(data.id)
	])

	const course_delta = prismaUpdateRequiredField<number, SerializedCourse>(course, data.course_id)
	const domains_delta = prismaUpdateArray<number, SerializedDomain>(domains, data.domain_ids)
	const subjects_delta = prismaUpdateArray<number, SerializedSubject>(subjects, data.subject_ids)
	const lectures_delta = prismaUpdateArray<number, SerializedLecture>(lectures, data.lecture_ids)
	const links_delta = prismaUpdateArray<number, SerializedLink>(links, data.link_ids)

	// Update database
	try {
		await prisma.graph.update({
			where: {
				id: data.id
			},
			data: {
				name: data.name,
				course: course_delta,
				domains: domains_delta,
				subjects: subjects_delta,
				lectures: lectures_delta,
				links: links_delta
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function reorder(domain_ids: number[]) {
	return await Promise.all(
		domain_ids.map(async (domain_id, order) => {
			try {
				return prisma.domain.update({
					where: {
						id: domain_id
					},
					data: {
						order: order
					}
				})
			} catch (error) {
				return Promise.reject(error)
			}
		})
	)
}

export async function remove(id: number) {
	try {
		await prisma.graph.delete({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}
}

export async function getAll(...relations: GraphRelation[]): Promise<SerializedGraph[]> {
	try {
		var graphs = await prisma.graph.findMany()
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		graphs.map(async graph => await reduce(graph, ...relations))
	)
}

export async function getById(id: number, ...relations: GraphRelation[]): Promise<SerializedGraph> {
	try {
		var graph = await prisma.graph.findUniqueOrThrow({
			where: {
				id
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await reduce(graph, ...relations)
}

export async function getCourse(id: number, ...relations: CourseRelation[]): Promise<SerializedCourse> {
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				course: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await CourseHelper.reduce(data.course, ...relations)
}

export async function getDomains(id: number, ...relations: DomainRelation[]): Promise<SerializedDomain[]> {
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				domains: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.domains.map(async domain => await DomainHelper.reduce(domain, ...relations))
	)
}

export async function getSubjects(id: number, ...relations: SubjectRelation[]): Promise<SerializedSubject[]> {
	try {
		var data = await prisma.graph.findUniqueOrThrow({
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

export async function getLectures(id: number, ...relations: LectureRelation[]): Promise<SerializedLecture[]> {
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				lectures: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.lectures.map(async lecture => await LectureHelper.reduce(lecture, ...relations))
	)
}

export async function getLinks(id: number, ...relations: LinkRelation[]): Promise<SerializedLink[]> {
	try {
		var data = await prisma.graph.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				links: true
			}
		})
	} catch (error) {
		return Promise.reject(error)
	}

	return await Promise.all(
		data.links.map(async link => await LinkHelper.reduce(link, ...relations))
	)
}
