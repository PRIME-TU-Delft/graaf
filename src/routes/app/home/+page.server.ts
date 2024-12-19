// External dependencies
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types.js';

// Internal dependencies
import { CourseHelper, ProgramHelper } from '$scripts/helpers';
import { asyncFlatmap } from '$scripts/utility';
import { programSchema } from './schema';

// Load
export const load: PageServerLoad = async () => {
	// Get data from the database
	const programs = await ProgramHelper.getAll('courses', 'admins');

	// Start data streams
	const courses = CourseHelper.getAll().catch((error) => {
		throw new Error(error);
	});
	const admins = asyncFlatmap(programs, (program) => ProgramHelper.getAdmins(program.id)).catch(
		(error) => {
			throw new Error(error);
		}
	);

	return { programs, courses, admins, form: await superValidate(zod(programSchema)) };
};

export const actions: Actions = {
	default: async (event) => {
		const { fetch } = event;

		const form = await superValidate(event, zod(programSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}

		const response = await fetch('/api/program', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ name: form.data.name })
		});

		if (!response.ok) {
			return fail(400, {
				form,
				error: await response.text()
			});
		}

		const data = await response.json();

		return {
			form,
			data
		};
	}
};
