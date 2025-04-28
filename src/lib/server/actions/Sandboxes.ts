import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { whereHasSandboxPermission } from '$lib/server/permissions';

import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { deleteSandboxSchema, editSandboxSchema } from '$lib/zod/sandboxSchema';

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
}
