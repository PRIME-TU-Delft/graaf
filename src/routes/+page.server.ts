import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ locals }) => {
	const session = await locals.auth();

	// This is redundant? see issue #33
	if (!session?.user) {
		redirect(303, '/auth');
	} else {
		redirect(303, '/graph-editor');
	}
};
