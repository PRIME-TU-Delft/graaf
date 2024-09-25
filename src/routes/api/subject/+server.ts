
import { SubjectHelper } from '$lib/server/helpers'

/**
 * An API endpoint for updating a Subject object in the database.
 * @param request PUT request containing a SerializedSubject object 
 */

export async function PUT({ request }) {
    
    // Retrieve data
    const data = await request.json()

    // Update domain
    return await SubjectHelper.update(data)
        .then(
            () => new Response('Subject updated', { status: 200 }),
            (error) => new Response(error, { status: 400 })
        )
}