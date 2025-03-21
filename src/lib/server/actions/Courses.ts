import type { CoursePermissionsOptions } from '$lib/utils/permissions';
import { setError } from '$lib/utils/setError';
import type { changeArchive, courseSchema, editSuperUserSchema } from '$lib/zod/courseSchema';
import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import prisma from '../db/prisma';

/**
 * Check if the user has permissions to edit the program
 * @param user - User
 * @param options - PermissionsOptions
 * @returns A json object that can be used in a Prisma where query
 * @example
 * const user = { id: 1, role: 'ADMIN' };
 * const adminPermissions = whereHasCoursePermission(user, {  courseAdmin: true, courseEditor: false });
 * const program = await prisma.program.findFirst({ where: { id: 1, ...adminPermissions } }); // Only program admins, editors,
 */
export function whereHasCoursePermission(user: User, has: CoursePermissionsOptions) {
	// If the user is a super-admin, they can edit any program. Thus no special where permission is required
	if (user.role == 'ADMIN') return {};
	else if (has === 'OnlySuperAdmin') throw new Error('Only super admins can do this action');

	const hasProgramAdminPermission = { programs: { some: { admins: { some: { id: user.id } } } } };
	const hasProgramEditorPermission = { programs: { some: { editors: { some: { id: user.id } } } } };
	const hasCourseAdminPermission = { admins: { some: { id: user.id } } };
	const hasCourseEditorPermission = { editors: { some: { id: user.id } } };

	const hasPermission: (
		| typeof hasCourseAdminPermission
		| typeof hasCourseEditorPermission
		| typeof hasProgramAdminPermission
		| typeof hasProgramEditorPermission
	)[] = [hasProgramAdminPermission];

	if (has == 'ProgramAdmin') return { OR: hasPermission };

	hasPermission.push(hasProgramEditorPermission);
	if (has == 'ProgramAdminEditor') return { OR: hasPermission };

	hasPermission.push(hasCourseAdminPermission);
	if (has == 'CourseAdminORProgramAdminEditor') return { OR: hasPermission };

	hasPermission.push(hasCourseEditorPermission);
	return { OR: hasPermission };
}

export class CourseActions {
	/**
	 * PERMISSIONS:
	 * - Only PROGRAM_ADMINS and SUPER_ADMIN can edit programs
	 */
	static async editProgram(user: User, form: SuperValidated<Infer<typeof courseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.course.update({
				where: {
					code: form.data.code,
					...whereHasCoursePermission(user, 'CourseAdminORProgramAdminEditor')
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

		try {
			await prisma.course.update({
				where: {
					code: formData.data.courseCode,
					...whereHasCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				},
				data: getData()
			});
		} catch {
			return setError(formData, '', 'Unauthorized');
		}
	}

	static async changeArchive(user: User, formData: SuperValidated<Infer<typeof changeArchive>>) {
		if (!formData.valid) return setError(formData, '', 'Form is not valid');

		try {
			await prisma.course.update({
				where: {
					code: formData.data.code,
					...whereHasCoursePermission(user, 'CourseAdminORProgramAdminEditor')
				},
				data: {
					isArchived: formData.data.archive
				}
			});
		} catch {
			return setError(formData, '', 'Unauthorized');
		}
	}
}
