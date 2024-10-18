
// Internal dependencies
import { DomainHelper } from "$scripts/helpers"

// Exports
export { GET }


// --------------------> API Endpoints


/**
 * API endpoint for getting the Subjects of a Domain
 * @returns `SerializedSubject[]`
 */

async function GET({ params }) {
	const domain_id = Number(params.id)
	if (!domain_id || isNaN(domain_id)) {
		return new Response('Invalid domain ID', { status: 400 })
	}

	return await DomainHelper.getSubjects(domain_id)
		.then(
			data => new Response(JSON.stringify(data), { status: 200 }),
			error => new Response(error, { status: 400 })
		)
}