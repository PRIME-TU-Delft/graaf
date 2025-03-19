import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

export const load = async ({ locals }) => {
	const session = await locals.auth();

	return {
		session,
		isInNetlify: env.NETLIFY_CONTEXT == 'DEPLOY_PREVIEW'
	};
};

export const actions = {
	'test-user': async (event) => {
		if (env.NETLIFY_CONTEXT != 'DEPLOY_PREVIEW') return { error: 'not in deploy preview' };

		const formData = await event.request.formData();

		const user_id = formData.get('userId') as string | undefined;
		if (!user_id) return { error: 'missing user_id' };

		event.cookies.set('user_id', user_id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365
		});
	}
} satisfies Actions;
