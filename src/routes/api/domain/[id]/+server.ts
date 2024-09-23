
import { DomainHelper } from '$lib/server/helpers'

/**
 * API endpoint for updating a Domain object in the database.
 * @param id ID of the Domain object to update
 * @param body JSON object containing the new values for the Domain object
 * @returns Response object
 */

export async function PATCH({ params, request }) {
	const id = Number(params.id)
	const data = await request.json()
	const tasks = []

	if (data.name) {
		tasks.push(DomainHelper.setName(id, data.name))
	} 
	
	if (data.style) {
		tasks.push(DomainHelper.setStyle(id, data.style))
	}

	if (data.x) {
		tasks.push(DomainHelper.setX(id, data.x))
	}

	if (data.y) {
		tasks.push(DomainHelper.setY(id, data.y))
	}

	if (data.parents) {
		tasks.push(DomainHelper.setParents(id, data.parents))
	}

	if (data.children) {
		tasks.push(DomainHelper.setChildren(id, data.children))
	}

	return await Promise.all(tasks)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for deleting a Domain object from the database.
 * @param id ID of the Domain object to delete
 * @returns Response object 
 */

export async function DELETE({ params }) {
	const id = Number(params.id)

	return await DomainHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}