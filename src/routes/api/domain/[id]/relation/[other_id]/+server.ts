
import { DomainHelper } from '$lib/server/helpers'

export async function PATCH({ params }) {
	const id = Number(params.id)
	const other_id = Number(params.other_id)

	return await DomainHelper.toggleRelation(id, other_id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}