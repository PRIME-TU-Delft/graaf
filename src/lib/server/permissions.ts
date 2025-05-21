import type {
	CoursePermissionsOptions,
	ProgramPermissionsOptions,
	SandboxPermissionOptions
} from '$lib/utils/permissions';
import type { User } from '@prisma/client';

/**
 * Check if the user has permissions to edit the program
 * @param user - User
 * @param isEither - PermissionsOptions
 * @returns A json object that can be used in a Prisma where query
 * @example
 * const user = { id: 1, role: 'ADMIN' };
 * const permissions = whereHasProgramPermission(user, "ProgramAdminEditor");
 * const program = await prisma.program.findFirst({ where: { id: 1, ...permissions } });
 */

export function whereHasProgramPermission(user: User, has: ProgramPermissionsOptions) {
	// If the user is a super-admin, they can edit any program. Thus no special where permission is required
	if (user.role == 'ADMIN') return {};
	else if (has === 'OnlySuperAdmin') throw new Error('Only super admins can do this action');

	const hasEditorPermission = { editors: { some: { id: user.id } } };
	const hasAdminPermission = { admins: { some: { id: user.id } } };

	if (has == 'ProgramAdmin') return { OR: [hasAdminPermission] };
	if (has == 'ProgramAdminEditor') return { OR: [hasAdminPermission, hasEditorPermission] };

	throw new Error('Invalid permission');
}

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

/**
 * Is a wrapper for whereHasCoursePermission to be used in
 * for queries that start with `prisma.graph.update` or other course CRUD operations
 * @param user - User
 * @param has - CoursePermissionsOptions
 * @returns A json object that can be used in a Prisma grap where query
 */

export function whereHasGraphCoursePermission(user: User, has: CoursePermissionsOptions) {
	if (user.role == 'ADMIN') return {};
	else if (has === 'OnlySuperAdmin') throw new Error('Only super admins can do this action');

	return {
		course: {
			...whereHasCoursePermission(user, has)
		}
	};
}

export function whereHasSandboxPermission(user: User, has: SandboxPermissionOptions) {
	const hasOwnerPermission = { ownerId: user.id };
	const hasEditorPermission = { editors: { some: { id: user.id } } };
	const hasPermission: (typeof hasOwnerPermission | typeof hasEditorPermission)[] = [
		hasOwnerPermission
	];

	if (has == 'Owner') return { OR: hasPermission };
	hasPermission.push(hasEditorPermission);
	return { OR: hasPermission };
}
