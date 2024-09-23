
import prisma from '$lib/server/prisma'

import type { Subject as PrismaSubject } from '@prisma/client'
import type { SerializedSubject } from '$scripts/entities'

export { create, remove, setX, setY, setName, setDomain, setParents, setChildren, makeDTO }


// ----------------> Internal


type RelationalQuery = {
	where: { id: number },
	data: {
		childSubjects: {
			connect: { id: number }[],
			disconnect: { id: number }[]
		},
		parentSubjects: {
			connect: { id: number }[],
			disconnect: { id: number }[]
		}
	}
}

function ensureQueryExists(queries: RelationalQuery[], id: number) {
	if (!queries.some(q => q.where.id === id)) {
		queries.push({
			where: { id },
			data: {
				parentSubjects: {
					disconnect: [],
					connect: []
				},
				childSubjects: {
					disconnect: [],
					connect: []
				}
			}
		})
	}
}


// ----------------> External


/**
 * Creates a Subject object in the database.
 * @param graph_id ID of the Graph object to which the Subject object belongs
 * @returns ID of the created Subject object
 */

async function create(graph_id: number): Promise<number> {
	const subject = await prisma.subject.create({
		data: {
			graph: {
				connect: {
					id: graph_id
				}
			}
		}
	})

	return subject.id
}

/**
 * Removes a Subject object from the database.
 * @param subject_id ID of the Subject object to remove
 * @returns void
 */

async function remove(subject_id: number): Promise<void> {
	await prisma.subject.delete({
		where: {
			id: subject_id
		}
	})
}

/**
 * Sets the x-coordinate of a Subject object.
 * @param subject_id ID of the Subject object to update
 * @param x new x-coordinate of the Subject object
 * @returns void
 * @throws 'Subject not found' if the Subject object is not found
 */

async function setX(subject_id: number, x: number): Promise<void> {

	// Check if the Subject object exists
	const subject = await prisma.subject.findUnique({
		where: {
			id: subject_id
		}
	})

	if (!subject) return Promise.reject('Subject not found')

	// Update
	await prisma.subject.update({
		where: {
			id: subject_id
		},
		data: {
			x
		}
	})
}

/**
 * Sets the y-coordinate of a Subject object.
 * @param subject_id ID of the Subject object to update
 * @param y new y-coordinate of the Subject object
 * @returns void
 * @throws 'Subject not found' if the Subject object is not found
 */

async function setY(subject_id: number, y: number): Promise<void> {
	
	// Check if the Subject object exists
	const subject = await prisma.subject.findUnique({
		where: {
			id: subject_id
		}
	})

	if (!subject) return Promise.reject('Subject not found')

	// Update
	await prisma.subject.update({
		where: {
			id: subject_id
		},
		data: {
			y
		}
	})
}

/**
 * Updates the name of a Subject object.
 * @param subject_id ID of the Subject object to update
 * @param name new name of the Subject object
 * @returns void
 * @throws 'Subject not found' if the Subject object is not found
 */

async function setName(subject_id: number, name?: string): Promise<void> {

	// Check if the Subject object exists
	const subject = await prisma.subject.findUnique({
		where: {
			id: subject_id
		}
	})

	if (!subject) return Promise.reject('Subject not found')

	// Update
		await prisma.subject.update({
		where: {
			id: subject_id
		},
		data: {
			name
		}
	})
}

/**
 * Sets the Domain of a Subject object.
 * @param subject_id ID of the Subject object to update
 * @param domain_id ID of the Domain object to set
 * @returns void
 * @throws 'Subject not found' if the Subject object is not found
 * @throws 'Domain not found' if the Domain object is not found
 */

async function setDomain(subject_id: number, domain_id: number): Promise<void> {
	const subject = await prisma.subject.findUnique({
		where: {
			id: subject_id
		}
	})

	if (!subject) return Promise.reject('Subject not found')

	const domain = await prisma.domain.findUnique({
		where: {
			id: domain_id
		}
	})

	if (!domain) return Promise.reject('Domain not found')

	await prisma.subject.update({
		where: {
			id: subject_id
		},
		data: {
			domain: {
				connect: {
					id: domain_id
				}
			}
		}
	})
}

/**
 * Sets the parents of a Subject object.
 * Programmed to minimize queries.
 * @param subject_id ID of the Subject object to update
 * @param parent_ids ids of the parent Subject objects
 * @returns void
 * @throws 'Subject not found' if the Subject object is not found
 */

async function setParents(subject_id: number, parent_ids: number[]): Promise<void> {
	const subject = await prisma.subject.findUnique({
		include: {
			parentSubjects: true,
			childSubjects: true
		},
		where: {
			id: subject_id
		}
	})

	if (!subject) return Promise.reject('Subject not found')

	// Build queries
	const queries: RelationalQuery[] = []

	// Remove old parents
	for (const parent of subject.parentSubjects) {
		if (!parent_ids.includes(parent.id)) { 
			ensureQueryExists(queries, subject_id)
			queries.find(q => q.where.id === subject_id)!
				.data.parentSubjects.disconnect.push({ id: parent.id })
			
			ensureQueryExists(queries, parent.id)
			queries.find(q => q.where.id === parent.id)!
				.data.childSubjects.disconnect.push({ id: subject_id })
		}
	}

	// Add new parents
	for (const parent_id of parent_ids) {
		if (!subject.parentSubjects.some(d => d.id === parent_id)) {
			const parent = await prisma.subject.findUnique({
				where: {
					id: parent_id
				}
			})

			if (!parent) return Promise.reject('Subject not found')

			ensureQueryExists(queries, subject_id)
			queries.find(q => q.where.id === subject_id)!
				.data.parentSubjects.connect.push({ id: parent_id })
			
			ensureQueryExists(queries, parent_id)
			queries.find(q => q.where.id === parent_id)!
				.data.childSubjects.connect.push({ id: subject_id })
		}
	}

	// Execute queries
	for (const query of queries) {
		await prisma.subject.update(query)
	}
}

/**
 * Sets the children of a Subject object.
 * Programmed to minimize queries.
 * @param subject_id ID of the Subject object to update
 * @param child_ids ids of the child Subject objects
 * @returns void
 * @throws 'Subject not found' if the Subject object is not found
 */

async function setChildren(subject_id: number, child_ids: number[]): Promise<void> {
	const subject = await prisma.subject.findUnique({
		include: {
			parentSubjects: true,
			childSubjects: true
		},
		where: {
			id: subject_id
		}
	})

	if (!subject) return Promise.reject('Subject not found')

	// Build queries
	const queries: RelationalQuery[] = []

	// Remove old children
	for (const child of subject.childSubjects) {
		if (!child_ids.includes(child.id)) { 
			ensureQueryExists(queries, subject_id)
			queries.find(q => q.where.id === subject_id)!
				.data.childSubjects.disconnect.push({ id: child.id })
			
			ensureQueryExists(queries, child.id)
			queries.find(q => q.where.id === child.id)!
				.data.parentSubjects.disconnect.push({ id: subject_id })
		}
	}

	// Add new children
	for (const child_id of child_ids) {
		if (!subject.childSubjects.some(d => d.id === child_id)) {
			const child = await prisma.subject.findUnique({
				where: {
					id: child_id
				}
			})

			if (!child) return Promise.reject('Subject not found')

			ensureQueryExists(queries, subject_id)
			queries.find(q => q.where.id === subject_id)!
				.data.childSubjects.connect.push({ id: child_id })
			
			ensureQueryExists(queries, child_id)
			queries.find(q => q.where.id === child_id)!
				.data.parentSubjects.connect.push({ id: subject_id })
		}
	}

	// Execute queries
	for (const query of queries) {
		await prisma.subject.update(query)
	}
}

/**
 * Converts a Subject object to a SerializedSubject object, which can be sent to the client.
 * @param subject plain Subject object
 * @returns SerializedSubject object
 */

async function makeDTO(subject: PrismaSubject): Promise<SerializedSubject> {
	return {
		id: subject.id,
		x: subject.x,
		y: subject.y,
		name: subject.name || undefined,
		domain: subject.domainId || undefined,
		children: await getChildIds(subject),
		parents: await getParentIds(subject)
	}
}

/**
 * Plain Subject objects dont have a children (many-to-many) field,
 * this method makes them available.
 * @param subject plain Subject object
 * @returns the ids of the children of the subject
 */

async function getChildIds(subject: PrismaSubject): Promise<number[]> {
	return (await prisma.subject.findMany({
		where: {
			parentSubjects: {
				some: {
					id: subject.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(d => d.id)
}

/**
 * Plain Subject objects dont have a parents (many-to-many) field,
 * this method makes them available.
 * @param subject plain Subject object
 * @returns the ids of the parents of the subject
 */

async function getParentIds(subject: PrismaSubject): Promise<number[]> {
	return (await prisma.subject.findMany({
		where: {
			childSubjects: {
				some: {
					id: subject.id
				}
			}
		},
		orderBy: {
			id: 'asc'
		}
	})).map(d => d.id)
}