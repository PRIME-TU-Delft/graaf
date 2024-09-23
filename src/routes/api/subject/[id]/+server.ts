
import { SubjectHelper } from '$lib/server/helpers'

/**
 * API endpoint for updating a Subject object in the database.
 * @param id ID of the Subject object to update
 * @param body JSON object containing the new values for the Subject object
 * @returns Response object
 */

export async function PATCH({ params, request }) {
	const id = Number(params.id)
	const data = await request.json()
	const tasks = []

	if (data.name) {
		tasks.push(SubjectHelper.setName(id, data.name))
	} 
	
	if (data.domain) {
		tasks.push(SubjectHelper.setDomain(id, data.domain))
	}

	if (data.x) {
		tasks.push(SubjectHelper.setX(id, data.x))
	}

	if (data.y) {
		tasks.push(SubjectHelper.setY(id, data.y))
	}

	if (data.parents) {
		tasks.push(SubjectHelper.setParents(id, data.parents))
	}

	if (data.children) {
		tasks.push(SubjectHelper.setChildren(id, data.children))
	}

	return await Promise.all(tasks)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Subject object from the database.
 * @param id ID of the Subject object to delete
 * @returns Response object 
 */

export async function DELETE({ params }) {
	const id = Number(params.id)

	return await SubjectHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}