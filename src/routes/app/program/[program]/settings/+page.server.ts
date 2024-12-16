// External dependencies
import type { PageServerLoad } from './$types';

import { CourseHelper, ProgramHelper, UserHelper } from '$scripts/helpers';

// Load
export const load: PageServerLoad = async ({ params }) => {
	const program_id = Number(params.program);
	if (isNaN(program_id)) return Promise.reject('Invalid program ID');

	// Start data streams
	const program = ProgramHelper.getById(program_id, 'courses', 'editors', 'admins').catch(
		(error) => {
			throw new Error(error);
		}
	);
	const courses = CourseHelper.getAll().catch((error) => {
		throw new Error(error);
	});
	const users = UserHelper.getAll().catch((error) => {
		throw new Error(error);
	});

	return { program, courses, users };
};
