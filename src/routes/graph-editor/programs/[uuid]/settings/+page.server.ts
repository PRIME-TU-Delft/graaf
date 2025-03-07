import { hasProgramPermissions } from '$lib/server/actions/Programs';
import prisma from '$lib/server/db/prisma';
import { deleteProgramSchema } from '$lib/zod/superUserProgramSchema';
import type { User } from '@prisma/client';
import { redirect, type Actions, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = (async ({ params, locals }) => {
	try {
		if (!params.uuid) throw Error('a program id is required');

		const session = await locals.auth();
		const user = session?.user as User | undefined;
		if (!user) redirect(303, '/auth');

		const dbProgram = await prisma.program.findFirst({
			where: {
				id: params.uuid,
				...hasProgramPermissions(user) // is either a program editor, admin, or super user
			},
			include: {
				admins: true,
				editors: true
			}
		});

		if (!dbProgram) throw Error('You do not have permissions to access this program');

		return {
			program: dbProgram,
			user,
			deleteProgramForm: await superValidate(zod(deleteProgramSchema))
		};
	} catch (e) {
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
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
