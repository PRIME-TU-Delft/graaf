import type { Handle } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth';
import prisma from '$lib/server/db/prisma';
import type { Session } from '@auth/sveltekit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
	// Disable all forms of authentication in deploy previews
	if (env.NETLIFY_CONTEXT == 'DEPLOY_PREVIEW') {
		event.locals.auth = async () => {
			const user = await prisma.user.findFirst({
				where: {
					email: 'testuser@tudelft.nl'
				}
			});

			if (!user) throw new Error('User not found');

			const session = {
				user,
				expires: new Date('2030-01-01T00:00:00.000Z').toDateString()
			} satisfies Session;

			return session;
		};

		const response = await resolve(event);

		return response;
	}

	return authHandle({ event, resolve });
};
