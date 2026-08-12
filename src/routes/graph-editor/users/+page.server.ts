import { ProgramActions, UserActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { editSuperUserSchema } from '$lib/zod/programSchema';
import { changeUserRoleSchema } from '$lib/zod/userSchema';
import { redirect, type Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

export const load = async ({ locals }) => {
	const user = await getUser({ locals });

	// If not a super admin, redirect to home
	if (user?.role != 'ADMIN') {
		throw redirect(303, '/');
	}

	try {
		const allUsers = await prisma.user.findMany({
			include: {
				course_admins: true,
				course_editors: true,
				program_admins: true,
				program_editors: true
			},
			orderBy: {
				role: 'desc' // ADMIN first then USER
			}
		});

		// Needed by the privileges dialog to offer programs a user can be added to. The admin and
		// editor ids let the dialog explain up front why a last-admin change is refused.
		const allPrograms = await prisma.program.findMany({
			include: {
				admins: { select: { id: true } },
				editors: { select: { id: true } }
			},
			orderBy: { name: 'asc' }
		});

		return {
			// Make sure the logged-in user is always first in the list
			users: allUsers.toSorted((a, b) => {
				if (a.id === user.id) return -1;
				if (b.id === user.id) return 1;
				return 0;
			}),
			user,
			allPrograms,
			changeUserRoleForm: await superValidate(zod(changeUserRoleSchema)),
			editSuperUserForm: await superValidate(zod(editSuperUserSchema))
		};
	} catch {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	'change-user-role': async (event) => {
		const form = await superValidate(event, zod(changeUserRoleSchema));
		return UserActions.changeRole(await getUser(event), form);
	},
	'edit-super-user': async (event) => {
		const form = await superValidate(event, zod(editSuperUserSchema));
		return ProgramActions.editSuperUser(await getUser(event), form);
	}
};
