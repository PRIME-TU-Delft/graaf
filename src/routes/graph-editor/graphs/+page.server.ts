import { redirect, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async () => {
	redirect(303, `/graph-editor`);
};
