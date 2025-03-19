
import prisma from '$lib/server/db/prisma';
import type { RequestHandler } from "@sveltejs/kit";

/*
 * Reposition the domains in a graph
 * This can be a on a server call because it is not critical
 **/

export const PATCH: RequestHandler = async ({ request }) => {

    // Validate request
    const body = await request.json();
    if (!body.domain_id || !body.x || !body.y) {
        return new Response("Missing required fields", { status: 400 });
    }  

    // Update domain
    try {
        await prisma.domain.update({
            where: { id: body.domain_id },
            data: {
                x: body.x,
                y: body.y
            }
        });

        return new Response("Domain updated", { status: 200 });
    } catch (error) {
        return new Response("Failed to update domain", { status: 500 });
    }
};