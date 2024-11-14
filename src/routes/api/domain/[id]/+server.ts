
// Internal dependencies
import { DomainHelper } from '$scripts/helpers'

// Exports
export { DELETE }


// --------------------> API Endpoints


async function DELETE({ params }) {

	// Retrieve domain ID
	const domain_id = Number(params.id)
	if (!domain_id || isNaN(domain_id)) {
		return new Response('Missing domain ID', { status: 400 })
	}

	// Delete the domain
	return await DomainHelper.remove(domain_id)
		.then(
			() => new Response(null, { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}