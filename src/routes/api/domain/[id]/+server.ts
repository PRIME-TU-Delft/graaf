
import { DomainHelper } from '$lib/server/helpers'

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
		if (data.y) {
			tasks.push(DomainHelper.setPosition(id, data.x, data.y))
		} else {
			tasks.push(DomainHelper.setX(id, data.x))
		}
	} else if (data.y) {
		tasks.push(DomainHelper.setY(id, data.y))
	}

	return await Promise.all(tasks)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}

export async function DELETE({ params }) {
	const id = Number(params.id)

	return await DomainHelper.remove(id)
		.then(
			() => new Response(null, { status: 200 }),
			(error) => new Response(error, { status: 400 })
		)
}