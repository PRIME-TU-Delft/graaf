
import { DomainHelper } from '$lib/server/helpers'

export async function PATCH({ params }) {
	const id = Number(params.id)
	const style = String(params.style)

	return await DomainHelper.setStyle(id, style)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}