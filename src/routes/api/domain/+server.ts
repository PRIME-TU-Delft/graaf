
import { DomainHelper } from '$lib/server/helpers'

export async function PUT({ request }) {
    
    // Retrieve data
    const data = await request.json()

    // Update domain
    return await DomainHelper.update(data)
        .then(
            () => new Response('Domain updated', { status: 200 }),
            (error) => new Response(error, { status: 500 })
        )
}