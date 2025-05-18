import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { whereHasSandboxPermission } from '$lib/server/permissions';

import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { 
	deleteSandboxSchema, 
	editSandboxSchema,
	editSuperUserSchema
} from '$lib/zod/sandboxSchema';
import { disconnect } from 'process';
import { connect } from 'http2';

export class SandboxActions {

	/**
	 * PERMISSIONS:
	 * - Only OWNERS can edit sandboxes
	 */

	static async editSandbox(user: User, form: SuperValidated<Infer<typeof editSandboxSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.sandbox.update({
				where: {
					id: form.data.sandboxId,
					...whereHasSandboxPermission(user, 'Owner')
				},
				data: {
					name: form.data.name
				}
			});
		} catch {
			return setError(form, '', "You don't have permission to edit this sandbox");
		}

		return { form };
	}

	/**
	 * PERMISSIONS:
	 * - Only OWNERS can delete sandboxes
	 */

	static async deleteSandbox(user: User, form: SuperValidated<Infer<typeof deleteSandboxSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.sandbox.delete({
				where: {
					id: form.data.sandboxId,
					...whereHasSandboxPermission(user, 'Owner')
				}
			});
		} catch {
			return setError(form, '', "You don't have permission to delete this sandbox");
		}
	}

	/**
	 * PERMISSIONS:
	 * - Only OWNERS can edit super users
	 */

	static async editSuperUser(user: User, form: SuperValidated<Infer<typeof editSuperUserSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

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
				return setError(form, '', "Can only revoke editors");
			} if (form.data.role === 'owner' && isOwner) {
				return setError(form, '', "User is already the owner of this sandbox");
			} if (form.data.role === 'editor' && isEditor) {
				return setError(form, '', "User is already an editor of this sandbox");
			} if (form.data.role === 'editor' && isOwner) {
				return setError(form, '', "Cannot add the owner as an editor");
			}

			const data: any = {};

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
			return setError(form, '', "Something went wrong");
		}

		return { form };
	}
}
