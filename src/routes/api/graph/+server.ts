
import { GraphHelper } from '$lib/server/helpers'

/**
 * An API endpoint for updating a Graph in the database.
 * @param request PUT request containing a SerializedGraph object 
 */

export async function PUT({ request }) {
    
    // Retrieve data
    const data = await request.json()

    // Update domain
    return await GraphHelper.update(data)
        .then(
            () => new Response('Lecture updated', { status: 200 }),
            (error) => new Response(error, { status: 400 })
        )
}