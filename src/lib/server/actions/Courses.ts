import type { CoursePermissionsOptions } from '$lib/utils/permissions';
import type { User } from '@prisma/client';

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
