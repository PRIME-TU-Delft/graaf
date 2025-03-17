import { env } from '$env/dynamic/private';
import { signOut } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async (event) => {
		if (env.NETLIFY_CONTEXT == 'DEPLOY_PREVIEW') {
			event.cookies.delete('user_id', {
				path: '/'
			});
		} else {
			signOut(event);
		}
	}
};
