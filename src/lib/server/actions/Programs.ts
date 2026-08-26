import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { newProgramSchema } from '$lib/zod/programSchema';
import { whereHasProgramPermission } from '../permissions';
import { GuardError, withGuardedMutation } from './guardedMutation';
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

		return await withGuardedMutation(
			() =>
				prisma.program.create({
					data: {
						name: form.data.name
					}
				}),
			form,
			'name'
		);
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

		return await withGuardedMutation(
			() =>
				prisma.program.update({
					where: {
						id: form.data.programId,
						...whereHasProgramPermission(user, 'ProgramAdmin')
					},
					data: {
						name: form.data.name
					}
				}),
			form,
			'',
			{ entity: 'Program', message: 'You do not have permission to edit this program' }
		);
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
	 * Decide whether a program role change is allowed, stopping a program from ending up with zero
	 * admins. Used by editSuperUser before it applies a role change.
	 *
	 * Only a change that takes the admin role away from the program's sole admin is blocked.
	 * Changes to editors, changes that grant admin, and any change while a second admin remains
	 * are all allowed.
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
		// Only demoting an existing admin can leave the program without one
		if (fromRole !== 'admin') return {};
		if (toRole === 'admin') return {};

		// Another admin stays behind, so losing this one is fine
		if (admins.length > 1) return {};

		if (toRole === 'editor') return { error: 'You cannot change the last admin to an editor' };
		return { error: 'You cannot revoke the last admin' };
	}

	/**
	 * Set, change, or revoke a program-level admin/editor role for a user, guarded by
	 * isAllowedToEditSuperUser so the program can't be left without any admins.
	 *
	 * The read of the current admins, the guard, and the update run in one serializable
	 * transaction, so two role changes racing each other cannot both see the same admin list and
	 * strip the program of its last admin between them. Postgres rolls one of them back, and that
	 * caller is asked to try again.
	 *
	 * @param user - The user performing the action, must have program admin rights
	 * @param formData - Validated form data with the programId, target userId, and new role
	 * ('admin' | 'editor' | 'revoke')
	 * @returns Nothing on success. On invalid input, missing permission, a disallowed role change
	 * (see isAllowedToEditSuperUser), or a lost race against a concurrent role change, returns the
	 * form with an error via setError.
	 */
	static async editSuperUser(
		user: User,
		formData: SuperValidated<Infer<typeof editSuperUserSchema>>
	) {
		if (!formData.valid) return setError(formData, '', 'Form is not valid');

		const newRole = formData.data.role;
		const userId = formData.data.userId;

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

		return await withGuardedMutation(
			() =>
				prisma.$transaction(
					async (tx) => {
						const program = await tx.program.findFirst({
							where: {
								id: formData.data.programId,
								...whereHasProgramPermission(user, 'ProgramAdmin')
							},
							include: {
								admins: { select: { id: true } },
								editors: { select: { id: true } }
							}
						});

						if (!program) throw new GuardError('Unauthorized');

						// if this user is the only program admin
						// admin -NOT ALLOWED-> editor
						// admin -NOT ALLOWED-> revoke
						const fromRole = program.admins.find((admin) => admin.id === userId)
							? 'admin'
							: program.editors.find((editor) => editor.id === userId)
								? 'editor'
								: 'revoke';

						const isAllowed = ProgramActions.isAllowedToEditSuperUser(
							fromRole,
							newRole,
							program.admins
						);
						if (isAllowed.error) throw new GuardError(isAllowed.error);

						await tx.program.update({
							where: {
								id: formData.data.programId,
								...whereHasProgramPermission(user, 'ProgramAdmin')
							},
							data: getData()
						});
					},
					{ isolationLevel: 'Serializable' }
				),
			formData,
			'',
			{
				writeConflictMessage:
					'Someone changed these roles at the same time, so this change was not applied. Please try again.'
			}
		);
	}
}
