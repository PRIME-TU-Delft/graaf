// External dependencies
import prisma from '$lib/server/prisma';
import type { Link as PrismaLink } from '@prisma/client';

// Internal dependencies
import { prismaUpdateOptionalField, prismaUpdateRequiredField } from '$scripts/utility';

import { CourseHelper, GraphHelper } from '$scripts/helpers';

import type { CourseRelation, GraphRelation, LinkRelation } from '$scripts/types';

import type { SerializedCourse, SerializedGraph, SerializedLink } from '$scripts/types';

// --------------------> Helper Functions

export async function reduce(
	link: PrismaLink,
	...relations: LinkRelation[]
): Promise<SerializedLink> {
	const serialized: SerializedLink = {
		id: link.id,
		unchanged: link.unchanged,
		name: link.name
	};

	// Add relations if requested
	if (relations.includes('course')) serialized.course_id = link.courseId;
	if (relations.includes('graph')) serialized.graph_id = link.graphId;

	return serialized;
}

export async function create(course_id: number): Promise<SerializedLink> {
	try {
		var link = await prisma.link.create({
			data: {
				courseId: course_id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(link, 'course', 'graph');
}

export async function update(data: SerializedLink) {
	// Get deltas
	const [course, graph] = await Promise.all([getCourse(data.id), getGraph(data.id)]);

	const course_delta = prismaUpdateRequiredField<number, SerializedCourse>(course, data.course_id);
	const graph_delta = prismaUpdateOptionalField<number, SerializedGraph>(graph, data.graph_id);

	// Update database
	try {
		await prisma.link.update({
			where: {
				id: data.id
			},
			data: {
				unchanged: data.unchanged,
				name: data.name,
				course: course_delta,
				graph: graph_delta
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function remove(id: number) {
	try {
		await prisma.link.delete({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}
}

export async function getAll(...relations: LinkRelation[]): Promise<SerializedLink[]> {
	try {
		var links = await prisma.link.findMany();
	} catch (error) {
		return Promise.reject(error);
	}

	return await Promise.all(links.map(async (link) => await reduce(link, ...relations)));
}

export async function getById(id: number, ...relations: LinkRelation[]): Promise<SerializedLink> {
	try {
		var link = await prisma.link.findUniqueOrThrow({
			where: {
				id
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await reduce(link, ...relations);
}

export async function getCourse(
	id: number,
	...relations: CourseRelation[]
): Promise<SerializedCourse> {
	try {
		var data = await prisma.link.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				course: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	return await CourseHelper.reduce(data.course, ...relations);
}

export async function getGraph(
	id: number,
	...relations: GraphRelation[]
): Promise<SerializedGraph | null> {
	try {
		var data = await prisma.link.findUniqueOrThrow({
			where: {
				id
			},
			select: {
				graph: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	if (data.graph !== null) return await GraphHelper.reduce(data.graph, ...relations);
	return null;
}

export async function getGraphFromCourseAndName(
	course_code: string,
	link_name: string,
	...relations: GraphRelation[]
): Promise<SerializedGraph> {
	try {
		var data = await prisma.link.findFirstOrThrow({
			where: {
				course: {
					code: course_code
				},
				name: link_name
			},
			select: {
				graph: true
			}
		});
	} catch (error) {
		return Promise.reject(error);
	}

	if (data.graph !== null) return await GraphHelper.reduce(data.graph, ...relations);
	return Promise.reject('No graph associated with this link');
}
