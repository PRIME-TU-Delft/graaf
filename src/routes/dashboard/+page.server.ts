import { fail } from '@sveltejs/kit';

export const actions = {
	newCourse: async ({ request }) => {
		const data = await request.formData();
		const code = String(data.get('code'));
		const name = String(data.get('name'));
		const programId = Number(data.get('program'));

		if (!code) return fail(400, { code, missing: true });
		if (!name) return fail(400, { name, missing: true });

		// Write to db
	},

	newProgram: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name'));

		if (!name) return fail(400, { name, missing: true });

		// Write to db
	}
};

export async function load() {
	//

	return {
		programs: [],
		courses: []
	};
}
