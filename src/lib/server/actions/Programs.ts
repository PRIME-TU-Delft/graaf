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
	editSuperUserSchema,
} from '$lib/zod/superUserProgramSchema';

export class ProgramActions {
	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#p2
	 * - Only super admins can add new programs
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
	 * PERMISSIONS:
	 * - Only PROGRAM_ADMINS and SUPER_ADMIN can edit programs
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
