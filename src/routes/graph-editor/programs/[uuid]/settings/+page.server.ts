import { hasProgramPermissions } from '$lib/server/actions/Programs';
import prisma from '$lib/server/db/prisma';
import type { User } from '@prisma/client';
import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema';

export const load = (async ({ params, locals }) => {
	if (!params.uuid) {
		return {
			course: undefined,
			error: 'Program is required',
			form: await superValidate(zod(formSchema))
		};
	}

	const session = await locals.auth();
	const user = session?.user as User | undefined;
	if (!user) redirect(303, '/auth');

	try {
		const dbProgram = await prisma.program.findFirst({
			where: {
				id: params.uuid,
				...hasProgramPermissions(user, { superAdmin: true, admin: false, editor: false })
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
			error: e instanceof Error ? e.message : `${e}`
		};
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'delete-program': async ({ request, locals }) => {
		const form = await request.formData();

		const id = form.get('programId') as string;

		const session = await locals.auth();
		const user = session?.user as User | undefined;
		if (!user) redirect(303, '/auth');

		try {
			await prisma.program.delete({
				where: {
					id,
					...hasProgramPermissions(user, { superAdmin: true, admin: false, editor: false })
				}
			});
		} catch (e: unknown) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		throw redirect(303, '/');
	}
};
