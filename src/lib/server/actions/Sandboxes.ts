import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { whereHasSandboxPermission } from '$lib/server/permissions';
import { withGuardedMutation } from './guardedMutation';
import { generateUniqueCode, isCodeTaken } from './codeGeneration';

import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type {
	deleteSandboxSchema,
	editSandboxSchema,
	editSuperUserSchema,
	leaveSandboxSchema,
	newSandboxSchema
} from '$lib/zod/sandboxSchema';
import { redirect } from '@sveltejs/kit';

/** Server actions for creating, editing, and deleting sandboxes, and for managing their
 * owner/editor roles. Called from form actions in `+page.server.ts` route files, one static
 * method per operation. */
export class SandboxActions {
	/**
	 * Create a new sandbox, owned by the creating user.
	 *
	 * PERMISSIONS
	 * - Any user can create sandboxes
	 *
	 * @param user - The user performing the action, becomes the sandbox's owner
	 * @param form - Validated form data with the sandbox name
	 * @returns `{ form }` on success. On invalid input or a failed create, returns the form with
	 * a `name`-field error via setError instead of throwing. Note the error message here says
	 * "create a new course", left over from a copy-paste of CourseActions.newCourse.
	 */
	static async newSandbox(user: User, form: SuperValidated<Infer<typeof newSandboxSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		const code = await generateUniqueCode(user.nickname || user.firstName || user.id);

		try {
			await prisma.sandbox.create({
				data: {
					name: form.data.name,
					code,
					uriCode: encodeURIComponent(code),
					owner: {
						connect: {
							id: user.id
						}
					}
				}
			});
		} catch {
			return setError(form, 'name', "You don't have permission to create a new course");
		}

		return {
			form
		};
	}

	/**
	 * Rename a sandbox.
	 *
	 * PERMISSIONS
	 * - Only OWNERS can edit sandboxes
	 *
	 * @param user - The user performing the action, must be the sandbox owner
	 * @param form - Validated form data with the sandboxId, the new name, and the new code
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with an error via setError instead of throwing. Returns a `code`-field error if the code is
	 * already taken by another Course or Sandbox.
	 */
	static async editSandbox(user: User, form: SuperValidated<Infer<typeof editSandboxSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		if (await isCodeTaken(form.data.code, { sandboxId: form.data.sandboxId })) {
			return setError(form, 'code', 'This code is already taken');
		}

		return await withGuardedMutation(
			() =>
				prisma.sandbox.update({
					where: {
						id: form.data.sandboxId,
						...whereHasSandboxPermission(user, 'Owner')
					},
					data: {
						name: form.data.name,
						code: form.data.code,
						uriCode: encodeURIComponent(form.data.code)
					}
				}),
			form,
			'',
			{ entity: 'Sandbox', message: "You don't have permission to edit this sandbox" }
		);
	}

	/**
	 * Add, revoke, or transfer ownership of a sandbox editor/owner role. Only the current owner
	 * can call this, including to transfer ownership away from themselves: setting role 'owner'
	 * makes the target user the new owner and demotes the previous owner to an editor, then
	 * redirects the caller to the home page since they no longer have owner access to this
	 * sandbox's settings page.
	 *
	 * PERMISSIONS
	 * - Only OWNERS can edit super users
	 *
	 * @param user - The user performing the action, must be the sandbox owner
	 * @param form - Validated form data with the sandboxId, target userId, and new role
	 * ('editor' | 'owner' | 'revoke')
	 * @returns `{ form }` on success for editor/revoke changes. On an ownership transfer, throws
	 * a redirect to `/` instead of returning. On invalid input, missing permission, or a
	 * disallowed transition (e.g. revoking a non-editor, or re-assigning an already-held role),
	 * returns the form with an error via setError.
	 */
	static async editSuperUser(user: User, form: SuperValidated<Infer<typeof editSuperUserSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');
		let doRedirect = false;

		try {
			const current = await prisma.sandbox.findUnique({
				where: {
					id: form.data.sandboxId,
					...whereHasSandboxPermission(user, 'Owner')
				},
				include: {
					editors: true
				}
			});

			if (!current) {
				return setError(form, '', "You don't have permission to edit this sandbox");
			}

			const isEditor = current.editors.some((editor) => editor.id === form.data.userId);
			const isOwner = current.ownerId === form.data.userId;

			if (form.data.role === 'revoke' && (isOwner || !isEditor)) {
				return setError(form, '', 'Can only revoke editors');
			}
			if (form.data.role === 'owner' && isOwner) {
				return setError(form, '', 'User is already the owner of this sandbox');
			}
			if (form.data.role === 'editor' && isEditor) {
				return setError(form, '', 'User is already an editor of this sandbox');
			}
			if (form.data.role === 'editor' && isOwner) {
				return setError(form, '', 'Cannot add the owner as an editor');
			}

			const data: {
				editors?: { connect?: { id: string }; disconnect?: { id: string } };
				owner?: { connect?: { id: string } };
			} = {};

			if (form.data.role === 'revoke' && isEditor) {
				data.editors = { disconnect: { id: form.data.userId } };
			} else if (form.data.role === 'editor') {
				data.editors = { connect: { id: form.data.userId } };
			} else if (form.data.role === 'owner') {
				data.editors = { connect: { id: current.ownerId } };
				data.owner = { connect: { id: form.data.userId } };
				if (isEditor) {
					data.editors.disconnect = { id: form.data.userId };
				}

				doRedirect = true;
			}

			await prisma.sandbox.update({
				where: {
					id: form.data.sandboxId,
					...whereHasSandboxPermission(user, 'Owner')
				},
				data
			});
		} catch (error) {
			console.error(error);
			return setError(form, '', 'Something went wrong');
		}

		if (doRedirect) {
			throw redirect(303, '/');
		}

		return { form };
	}

	/**
	 * Permanently delete a sandbox, then redirect the caller to the home page.
	 *
	 * PERMISSIONS
	 * - Only OWNERS can delete sandboxes
	 *
	 * @param user - The user performing the action, must be the sandbox owner
	 * @param form - Validated form data with the sandboxId to delete
	 * @returns Never returns normally: on success it throws a redirect to `/`. On invalid input
	 * or missing permission, returns the form with an error via setError instead of throwing.
	 */
	static async deleteSandbox(user: User, form: SuperValidated<Infer<typeof deleteSandboxSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		const result = await withGuardedMutation(
			() =>
				prisma.sandbox.delete({
					where: {
						id: form.data.sandboxId,
						...whereHasSandboxPermission(user, 'Owner')
					}
				}),
			form,
			'',
			{ entity: 'Sandbox', message: "You don't have permission to delete this sandbox" }
		);

		if ('status' in result) return result;

		throw redirect(303, '/');
	}

	/**
	 * Remove the acting user as an editor of a sandbox, then redirect them to the home page
	 * since they no longer have access to this sandbox's page.
	 *
	 * PERMISSIONS
	 * - Any user who is an EDITOR (not owner) of the sandbox can remove themselves
	 *
	 * @param user - The user performing the action, must be an editor of the sandbox
	 * @param form - Validated form data with the sandboxId to leave
	 * @returns Never returns normally: on success it throws a redirect to `/`. On invalid input
	 * or missing permission, returns the form with an error via setError instead of throwing.
	 */
	static async leaveSandbox(user: User, form: SuperValidated<Infer<typeof leaveSandboxSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.sandbox.update({
				where: {
					id: form.data.sandboxId,
					editors: { some: { id: user.id } }
				},
				data: {
					editors: { disconnect: { id: user.id } }
				}
			});
		} catch {
			return setError(form, '', "You don't have permission to leave this sandbox");
		}

		throw redirect(303, '/');
	}
}
