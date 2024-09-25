
import { DomainHelper } from '$lib/server/helpers'

/**
 * An API endpoint for updating a Domain object in the database.
 * @param request PUT request containing a SerializedDomain object 
 */

export async function PUT({ request }) {
    
    // Retrieve data
    const data = await request.json()

    // Update domain
    return await DomainHelper.update(data)
        .then(
            () => new Response('Domain updated', { status: 200 }),
            (error) => new Response(error, { status: 400 })
        )
}