import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './[graphid]/$types';

export const load: LayoutServerLoad = async ({ params }) => {
	redirect(303, `/graph-editor/courses/${params.code}`);
};
