
import { DomainHelper } from '$lib/server/helpers'

export async function PATCH({ params }) {
	const id = Number(params.id)
    const name = String(params.name)

    await DomainHelper.setName(id, name)
	return new Response(null, { status: 200 })
}