import { redirect } from '@sveltejs/kit';

export const load = async ({ params }) => {
	throw redirect(302, `./${params.graphid}/domains`);
};
