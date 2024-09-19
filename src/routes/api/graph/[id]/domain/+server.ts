
import { DomainHelper } from '$lib/server/helpers'

export async function POST({ params }) {
	const id = Number(params.id)
	const dto = await DomainHelper.create(id)

	return new Response(JSON.stringify(dto), { status: 201 })
}