import { signIn } from '$lib/server/auth';
import { redirect, type ServerLoad } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: ServerLoad = async () => {
	redirect(303, '/auth');
};

export const actions: Actions = { default: signIn };
