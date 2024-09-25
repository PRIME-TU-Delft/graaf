
import prisma from '$lib/server/prisma'

import type { Subject as PrismaSubject } from '@prisma/client'
import type { SerializedSubject } from '$scripts/entities'

export { create, remove, update, reduce }

/**
 * Creates a Subject object in the database.
 * @param graph_id ID of the Graph to which the Subject belongs
 * @returns SerializedSubject object
 * @throws 'Failed to create subject' if the Subject could not be created
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
 * Removes a Subject from the database.
 * @param subject_id ID of the Subject to remove
 * @throws 'Failed to remove subject' if the Subject could not be removed
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
 * Updates a Subject in the database.
 * @param data SerializedSubject object
 * @throws 'Subject not found' if the Subject could not be found
 * @throws 'Failed to update subject' if the Subject could not be updated
 */

async function update(data: SerializedSubject): Promise<void> {

	// Get current relations
	const { children, parents } = await getRelations(data.id)

	// Find changes in relations
	const new_parents = data.parents.filter((parent) => !parents.some((subject) => subject.id === parent))
	const old_parents = parents.filter((parent) => !data.parents.includes(parent.id))
	const new_children = data.children.filter((child) => !children.some((subject) => subject.id === child))
	const old_children = children.filter((child) => !data.children.includes(child.id))

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
				domainId: data.domain,

				parentSubjects: {
					connect: new_parents.map((parent) => ({ id: parent })),
					disconnect: old_parents.map((parent) => ({ id: parent.id }))
				},

				childSubjects: {
					connect: new_children.map((child) => ({ id: child })),
					disconnect: old_children.map((child) => ({ id: child.id }))
				},
			}
		})
	} catch (error) {
		return Promise.reject('Failed to update subject')
	}
}

/**
 * Reduces a PrismaSubject to a SerializedSubject.
 * @param subject PrismaSubject object
 * @returns SerializedSubject object
 * @throws 'Subject not found' if the Subject could not be found
 */

async function reduce(subject: PrismaSubject): Promise<SerializedSubject> {
	const { children, parents } = await getRelations(subject.id)

	return {
		id: subject.id,
		x: subject.x,
		y: subject.y,
		name: subject.name || undefined,
		domain: subject.domainId || undefined,
		children: children.map(subject => subject.id),
		parents: parents.map(subject => subject.id)
	}
}

/**
 * Retrieves the children and parents of a Subject.
 * @param subject_id ID of the Subject
 * @returns Object containing the children and parents
 * @throws 'Subject not found' if the Subject could not be found
 */

async function getRelations(subject_id: number): Promise<{ children: PrismaSubject[], parents: PrismaSubject[]}> {
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
		children: subject.childSubjects,
		parents: subject.parentSubjects
	}
}