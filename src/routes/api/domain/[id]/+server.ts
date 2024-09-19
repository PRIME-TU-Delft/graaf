
import { DomainHelper } from '$lib/server/helpers'

export async function DELETE({ params }) {
	const id = Number(params.id)

	await DomainHelper.remove(id)
	return new Response(null, { status: 200 })
}