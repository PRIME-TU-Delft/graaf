import { signIn } from '$lib/server/auth';
import type { User } from '@prisma/client';
import type { Actions, ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	return {
		user: (session?.user as User) ?? null
	};
};

export const actions: Actions = {
	auth: signIn
};
