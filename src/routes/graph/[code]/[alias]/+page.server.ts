import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params }) => {
	const courseCode = params.code;
	const alias = params.alias;

	if (!courseCode || !alias) {
		throw new Error('Course code and alias are required');
	}

	return {
		courseCode,
		alias
	};
};
