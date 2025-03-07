import prisma from '$lib/server/db/prisma';
import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = (async ({ params }) => {
	if (!params.id) {
		return {
			course: undefined,
			error: 'Program is required',
			form: await superValidate(zod(formSchema))
		};
	}

	try {
		const dbProgram = await prisma.program.findFirst({
			where: {
				id: params.id
			}
		});

		if (!dbProgram) {
			return {
				course: undefined,
				error: 'Program not found',
				form: await superValidate(zod(formSchema))
			};
		}

		return {
			error: undefined,
			program: dbProgram
		};
	} catch (e: unknown) {
		return {
			course: undefined,
			error: e instanceof Error ? e.message : `${e}`,
			form: await superValidate(zod(formSchema))
		};
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'delete-program': async ({ request }) => {
		const form = await request.formData();

		const id = form.get('programId') as string;

		try {
			await prisma.program.delete({
				where: { id }
			});
		} catch (e: unknown) {
			return fail(500, {
				form,
				error: e instanceof Error ? e.message : `${e}`
			});
		}

		throw redirect(303, '/');
	}
};
