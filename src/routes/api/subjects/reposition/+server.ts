
import prisma from '$lib/server/db/prisma';
import type { RequestHandler } from "@sveltejs/kit";

/*
 * Reposition the subjects in a graph
 * This can be a on a server call because it is not critical
 **/

export const PATCH: RequestHandler = async ({ request }) => {

    // Validate request
    const body = await request.json();
    if (!body.subject_id || !body.x || !body.y) {
        return new Response("Missing required fields", { status: 400 });
    }  

    // Update subject
    try {
        await prisma.subject.update({
            where: { id: body.subject_id },
            data: {
                x: body.x,
                y: body.y
            }
        });

        return new Response("Subject updated", { status: 200 });
    } catch (error) {
        return new Response("Failed to update subject", { status: 500 });
    }
};