
import { SubjectHelper } from '$lib/server/helpers'

/**
 * API endpoint for creating a Subject in the database.
 * @returns SerializedSubject
 */

export async function POST({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to create subject: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await SubjectHelper.create(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 201 }),
			error => new Response(error, { status: 400 })
		)
}

/**
 * API endpoint for retrieving all Subjects associated with a Graph.
 * @returns Array of SerializedSubjects
 */

export async function GET({ params }) {
	if (!params.id || isNaN(Number(params.id)))
		return new Response('Failed to get subjects: Invalid graph ID', { status: 400 })
	const id = Number(params.id)

	return await SubjectHelper.getByGraphId(id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}

