
import { DomainHelper } from '$lib/server/helpers'

export async function DELETE({ params }) {
	const id = Number(params.id)

	return await DomainHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}