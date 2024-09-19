
import { DomainHelper } from '$lib/server/helpers'

export async function PATCH({ params }) {
	const id = Number(params.id)
	const x = Number(params.x)
	const y = Number(params.y)

	return await DomainHelper.setPosition(id, x, y)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}