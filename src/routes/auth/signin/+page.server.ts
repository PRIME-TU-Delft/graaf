import { signIn } from '$lib/server/auth';

import type { Actions } from './$types';
export const actions: Actions = {
	default: async (request) => {
		console.log({ request });
		const signin = signIn(request);
		return signin;
	}
};
