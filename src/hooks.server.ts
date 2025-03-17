import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth';
import prisma from '$lib/server/db/prisma';
import type { Session } from '@auth/sveltekit';
import { env } from '$env/dynamic/private';

async function authFunction(event: RequestEvent, user_id?: string) {
	if (!user_id) return null;

	const user = await prisma.user.findFirst({
		where: {
			id: user_id
		}
	});

	if (!user) return null;

	const session = {
		user,
		expires: new Date('2030-01-01T00:00:00.000Z').toDateString()
	} satisfies Session;

	return session;
}

export const handle: Handle = async ({ event, resolve }) => {
	// Disable all forms of authentication in deploy previews
	if (env.NETLIFY_CONTEXT == 'DEPLOY_PREVIEW') {
		const user_id = event.cookies.get('user_id');

		console.log(event.url.pathname.startsWith('/auth'));

		if (!user_id && event.url.pathname.startsWith('/auth')) {
			event.locals.auth = () => authFunction(event, user_id);
			return await resolve(event);
		} else if (!user_id) {
			redirect(307, '/auth');
		}

		event.locals.auth = () => authFunction(event, user_id);

		return await resolve(event);
	}

	return authHandle({ event, resolve });
};
