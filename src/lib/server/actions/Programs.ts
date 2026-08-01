import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { newProgramSchema } from '$lib/zod/programSchema';
import { whereHasProgramPermission } from '../permissions';
import { redirect } from '@sveltejs/kit';

import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { User } from '@prisma/client';

import type {
	deleteProgramSchema,
	editProgramSchema,
	editSuperUserSchema
} from '$lib/zod/programSchema';

/** Server actions for creating, editing, and deleting programs, and for managing their
 * admin/editor super users. Called from form actions in `+page.server.ts` route files, one
 * static method per operation. */
export class ProgramActions {
	/**
	 * Create a new program.
	 *
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#p2
	 * - Only super admins can add new programs
	 *
	 * @param user - The user performing the action, must have the super-admin role
	 * @param form - Validated form data with the program name
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `name`-field error via setError instead of throwing.
	 */
	static async newProgram(user: User, form: SuperValidated<Infer<typeof newProgramSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		// Check if user is a super admin, otherwise return an error
		if (user.role !== 'ADMIN') {
			return setError(form, '', 'You do not have permission to perform this action');
		}

		try {
			await prisma.program.create({
				data: {
					name: form.data.name
				}
			});
		} catch (e) {
			if (!(e instanceof Object) || !('message' in e)) {
				return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
			}
			return setError(form, 'name', `${e.message}`);
		}

		return { form };
	}

	/**
	 * Rename a program.
	 *
	 * PERMISSIONS:
	 * - Only PROGRAM_ADMINS and SUPER_ADMIN can edit programs
	 *
	 * @param user - The user performing the action, must have program admin rights
	 * @param form - Validated form data with the programId and the new name
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with an "Unauthorized" error via setError instead of throwing.
	 */
	static async editProgram(user: User, form: SuperValidated<Infer<typeof editProgramSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId,
					...whereHasProgramPermission(user, 'ProgramAdmin')
				},
				data: {
					name: form.data.name
				}
			});
		} catch {
			return setError(form, '', 'Unauthorized');
		}

		return { form };
	}

	/**
	 * Permanently delete a program, then redirect the caller to the home page.
	 *
	 * @param user - The user performing the action, must have the super-admin role
	 * @param formData - Validated form data with the programId to delete
	 * @returns Never returns normally: on success it throws a redirect to `/`. On invalid input
	 * it returns the form with an error via setError; on a failed delete it returns `{ error }`.
	 */
	static async deleteProgram(
		user: User,
		formData: SuperValidated<Infer<typeof deleteProgramSchema>>
	) {
		if (!formData.valid) return setError(formData, '', 'Form is not valid');

		try {
			await prisma.program.delete({
				where: {
					id: formData.data.programId,
					...whereHasProgramPermission(user, 'OnlySuperAdmin')
				}
			});
		} catch (e: unknown) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		throw redirect(303, '/');
	}

	/**
	 * Decide whether a program role change is allowed, intended to stop a program from ending up
	 * with zero admins. Used by editSuperUser before it applies a role change.
	 *
	 * Note the guard only activates once `admins` is already empty: as written, any change is
	 * allowed whenever the program currently has one or more admins, and the "cannot change/revoke
	 * the last admin" errors below only trigger when `admins.length` is already 0.
	 *
	 * @param fromRole - The user's current role
	 * @param toRole - The role being changed to
	 * @param admins - The program's current admins, before this change is applied
	 * @returns `{}` if the change is allowed, or `{ error: string }` describing why it isn't
	 */
	static isAllowedToEditSuperUser<Role = 'admin' | 'editor' | 'revoke'>(
		fromRole: Role,
		toRole: Role,
		admins: { id: string }[]
	) {
		if (fromRole === 'revoke') return {};
		if (admins.length >= 1) return {};

		if (fromRole === toRole) return { error: 'You cannot change the role to the same role' };

		if (fromRole == 'admin' && toRole === 'editor')
			return { error: 'You cannot change the last admin to an editor' };
		if (fromRole == 'admin' && toRole === 'revoke')
			return { error: 'You cannot revoke the last admin' };

		return { error: 'You cannot change the last admin' };
	}

	/**
	 * Set, change, or revoke a program-level admin/editor role for a user, guarded by
	 * isAllowedToEditSuperUser so the program can't be left without any admins.
	 *
	 * Note the user's current role is derived by checking `program.admins` twice (not
	 * `program.editors` for the editor case), so `fromRole` as computed here only ever resolves
	 * to 'admin' or 'revoke', never 'editor', regardless of the target user's actual current role.
	 *
	 * @param user - The user performing the action, must have program admin rights
	 * @param formData - Validated form data with the programId, target userId, and new role
	 * ('admin' | 'editor' | 'revoke')
	 * @returns Nothing on success. On invalid input, missing permission, or a disallowed role
	 * change (see isAllowedToEditSuperUser), returns the form with an error via setError.
	 */
	static async editSuperUser(
		user: User,
		formData: SuperValidated<Infer<typeof editSuperUserSchema>>
	) {
		if (!formData.valid) return setError(formData, '', 'Form is not valid');

		const newRole = formData.data.role;
		const userId = formData.data.userId;

		const program = await prisma.program.findFirst({
			where: {
				id: formData.data.programId,
				...whereHasProgramPermission(user, 'ProgramAdmin')
			},
			include: {
				admins: { select: { id: true } },
				editors: { select: { id: true } }
			}
		});

		if (!program) return setError(formData, '', 'Unauthorized');

		// if program.admins.length <= 1
		// admin -NOT ALLOWED-> editor
		// admin -NOT ALLOWED-> revoke
		const fromRole = program.admins.find((admin) => admin.id === userId)
			? 'admin'
			: program.admins.find((admin) => admin.id === userId)
				? 'editor'
				: 'revoke';

		const isAllowed = ProgramActions.isAllowedToEditSuperUser(fromRole, newRole, program.admins);
		if (isAllowed.error) return setError(formData, '', isAllowed.error);

		function getData() {
			switch (newRole) {
				case 'admin':
					return {
						admins: { connect: { id: userId } },
						editors: { disconnect: { id: userId } }
					};
				case 'editor':
					return {
						editors: { connect: { id: userId } },
						admins: { disconnect: { id: userId } }
					};
				case 'revoke':
					return {
						admins: { disconnect: { id: userId } },
						editors: { disconnect: { id: userId } }
					};
			}
		}

		try {
			await prisma.program.update({
				where: {
					id: formData.data.programId,
					...whereHasProgramPermission(user, 'ProgramAdmin')
				},
				data: getData()
			});
		} catch (e: unknown) {
			return setError(formData, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
