import { dev } from '$app/environment';
import prisma from '$lib/server/db/prisma';
import type { User } from '@prisma/client';
import { json, type RequestHandler } from '@sveltejs/kit';

export const PATCH: RequestHandler = async ({ locals }) => {
	if (!dev) return json({ error: 'Only allowed in dev mode' });

	const session = await locals.auth();
	const user = session?.user as User | undefined;

	if (!user) return json({ error: 'no user found' });

	const response = await prisma.user.update({
		where: {
			id: user.id
		},
		data: {
			role: user.role === 'ADMIN' ? 'USER' : 'ADMIN'
		}
	});

	return json(response);
};
