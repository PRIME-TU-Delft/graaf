import { json, redirect, type Handle, type RequestEvent } from '@sveltejs/kit';
import { handle as authHandle } from '$lib/server/auth';
import prisma from '$lib/server/db/prisma';
import type { Session } from '@auth/sveltekit';
import { env } from '$env/dynamic/private';

async function authFunction(event: RequestEvent, user_id?: string) {
	if (!user_id) return null;

	try {
		const user = await prisma.user.findFirst({
			where: {
				id: user_id
			}
		});

		if (!user) return null;

		const expires = new Date();
		expires.setFullYear(expires.getFullYear() + 1);

		const session = {
			user,
			expires: expires.toDateString()
		} satisfies Session;

		return session;
	} catch {
		return null;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	// Suppress well-known Chrome DevTools requests
	// From https://www.reddit.com/r/node/comments/1kcr0wh/comment/mq62f24
	if (event.url.pathname.startsWith('/.well-known/appspecific/com.chrome.devtools')) {
		return json({
			workspace: {
				root: env.ROOT || '',
				uuid: '839e066f-bc31-4813-ac9b-09fafcfdd014'
			}
		});
	}

	// Disable all forms of authentication in deploy previews
	if (env.NETLIFY_CONTEXT == 'DEPLOY_PREVIEW') {
		const user_id = event.cookies.get('user_id');

		if (!user_id && event.url.pathname.startsWith('/auth')) {
			event.locals.auth = () => authFunction(event, user_id);
			return await resolve(event);
		} else if (!user_id) {
			redirect(307, '/auth?error=No user found');
		}

		event.locals.auth = () => authFunction(event, user_id);

		return await resolve(event);
	}

	return authHandle({ event, resolve });
};
