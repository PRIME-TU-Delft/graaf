
import prisma from '$lib/server/prisma'

import type { Subject as PrismaSubject } from '@prisma/client'
import type { SerializedSubject } from '$scripts/entities'

export { create, remove, update, reduce, getRelations }

/**
 * Creates a Subject object in the database.
 * @param graph_id ID of the Graph object to which the Subject object belongs
 * @returns ID of the created Subject object
 * @throws 'Failed to create subject' if the Subject object could not be created
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
		return Promise.reject('Failed to create subject')
	}

	return await reduce(subject)
}

/**
 * Removes a Subject object from the database.
 * @param subject_id ID of the Subject object to remove
 * @throws 'Failed to remove subject' if the Subject object could not be removed
 */

async function remove(subject_id: number): Promise<void> {
	try {
		await prisma.subject.delete({
			where: {
				id: subject_id
			}
		})
	} catch (error) {
		return Promise.reject('Failed to remove subject')
	}
}

/**
 * Updates a Subject object in the database.
 * @param data SerializedSubject object
 * @throws 'Subject not found' if the Subject object could not be found
 */

async function update(data: SerializedSubject): Promise<void> {

	// Get current relations
	const { children, parents } = await getRelations(data.id)
		.catch(() => Promise.reject('Subject not found'))

	// Find changes in relations
	const new_parents = data.parents.filter((parent) => !parents.includes(parent))
	const old_parents = parents.filter((parent) => !data.parents.includes(parent))
	const new_children = data.children.filter((child) => !children.includes(child))
	const old_children = children.filter((child) => !data.children.includes(child))
	
	// Update subject
	await prisma.subject.update({
		where: {
			id: data.id
		},	
		data: {
			x: data.x,
			y: data.y,
			name: data.name,
			domainId: data.domain,

			parentSubjects: {
				connect: new_parents.map((parent) => ({ id: parent })),
				disconnect: old_parents.map((parent) => ({ id: parent }))
			},

			childSubjects: {
				connect: new_children.map((child) => ({ id: child })),
				disconnect: old_children.map((child) => ({ id: child }))
			},
		}
	})
}

/**
 * Reduces a PrismaSubject object to a SerializedSubject object.
 * @param subject PrismaSubject object
 * @returns SerializedSubject object
 * @throws 'Subject not found' if the Subject object could not be found
 */

async function reduce(subject: PrismaSubject): Promise<SerializedSubject> {
	const { children, parents } = await getRelations(subject.id)
		.catch(() => Promise.reject('Subject not found'))

	return {
		id: subject.id,
		x: subject.x,
		y: subject.y,
		name: subject.name || undefined,
		domain: subject.domainId || undefined,
		children: children,
		parents: parents
	}
}

/**
 * Retrieves the children and parents of a subject.
 * @param subject_id ID of the subject
 * @returns Object containing the IDs of the children and parents
 * @throws 'Subject not found' if the Subject object could not be found
 */

async function getRelations(subject_id: number): Promise<{ children: number[], parents: number[]}> {
	try {
		var subject = await prisma.subject.findUniqueOrThrow({
			where: {
				id: subject_id
			},
			include: {
				childSubjects: true,
				parentSubjects: true
			}
		})
	} catch (error) {
		return Promise.reject('Subject not found')
	}

	return {
		children: subject.childSubjects.map((subject) => subject.id),
		parents: subject.parentSubjects.map((subject) => subject.id)
	}
}