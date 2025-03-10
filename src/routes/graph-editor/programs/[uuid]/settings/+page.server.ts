import { ProgramActions } from '$lib/server/actions';
import { hasProgramPermissions } from '$lib/server/actions/Programs';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { deleteProgramSchema, editSuperUserSchema } from '$lib/zod/superUserProgramSchema';
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

		const allUsers = await prisma.user.findMany();

		if (!dbProgram) throw Error('You do not have permissions to access this program setting page');

		return {
			program: dbProgram,
			user,
			allUsers,
			deleteProgramForm: await superValidate(zod(deleteProgramSchema)),
			editSuperUserForm: await superValidate(zod(editSuperUserSchema))
		};
	} catch (e) {
		if (e instanceof Error) throw redirect(303, `/graph-editor/?error=${e.message}`);
		throw redirect(303, `/graph-editor`);
	}
}) satisfies ServerLoad;

export const actions: Actions = {
	'delete-program': async (event) => {
		const form = await superValidate(event, zod(deleteProgramSchema));
		return ProgramActions.deleteProgram(await getUser(event), form);
	},
	'edit-super-user': async (event) => {
		const form = await superValidate(event, zod(editSuperUserSchema));
		return ProgramActions.editSuperUser(await getUser(event), form);
	}
};
