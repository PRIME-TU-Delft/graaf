import prisma from '$lib/server/db/prisma';
import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = (async ({ params }) => {
	if (!params.uuid) {
		return {
			course: undefined,
			error: 'Program is required',
			form: await superValidate(zod(formSchema))
		};
	}

	try {
		const dbProgram = await prisma.program.findFirst({
			where: {
				id: params.uuid
			}
		});

		if (!dbProgram) {
			return {
				course: undefined,
				error: 'Program not found',
				form: await superValidate(zod(formSchema))
			};
		}

		const form = await superValidate(zod(formSchema));
		form.data.programId = dbProgram.id;
		form.data.isArchived = dbProgram.isArchived;

		return {
			error: undefined,
			program: dbProgram,
			form: form
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
	'archive-program': async (event) => {
		const form = await superValidate(event, zod(formSchema));

		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		console.log(form);

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId
				},
				data: {
					isArchived: !form.data.isArchived
				}
			});
		} catch (e: unknown) {
			return fail(500, {
				form,
				error: e instanceof Error ? e.message : `${e}`
			});
		}

		return {
			form
		};
	},
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
