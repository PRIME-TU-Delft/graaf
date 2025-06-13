import type { User } from '@prisma/client';

export type ProgramsPermissions = {
	editors?: { id: string }[];
	admins?: { id: string }[];
};

export type CoursePermissions = {
	editors?: { id: string }[];
	admins?: { id: string }[];
	programs: ProgramsPermissions[];
};

export type SandboxPermissions = {
	editors?: { id: string }[];
	owner?: { id: string };
};

export type ProgramPermissionsOptions = 'OnlySuperAdmin' | 'ProgramAdmin' | 'ProgramAdminEditor';

export type CoursePermissionsOptions =
	| ProgramPermissionsOptions
	| 'CourseAdminORProgramAdminEditor'
	| 'CourseAdminEditorORProgramAdminEditor';

export type SandboxPermissionOptions = 'Owner' | 'OwnerOREditor';

export function hasProgramPermissions(
	user: User,
	program: ProgramsPermissions,
	has: ProgramPermissionsOptions
) {
	// If the user is a super-admin, they can edit any course. Thus no special where permission is required
	if (user.role == 'ADMIN') return true;
	else if (has === 'OnlySuperAdmin') return false;

	const isProgramAdmin = program.admins?.some((admin) => admin.id === user.id) ?? false;
	const isProgramEditor = program.editors?.some((editor) => editor.id === user.id) ?? false;

	if (has == 'ProgramAdmin') return isProgramAdmin;
	if (has == 'ProgramAdminEditor') return isProgramAdmin || isProgramEditor;

	return false;
}

export function hasCoursePermissions(
	user: User,
	course: CoursePermissions,
	has: CoursePermissionsOptions
) {
	// If the user is a super-admin, they can edit any course. Thus no special where permission is required
	if (user.role == 'ADMIN') return true;
	else if (has === 'OnlySuperAdmin') return false;

	const isProgramAdmin = course.programs.some(
		(program) => program.admins?.some((admin) => admin.id === user.id) ?? false
	);
	const isProgramEditor = course.programs.some(
		(program) => program.editors?.some((editor) => editor.id === user.id) ?? false
	);
	const isCourseAdmin = course.admins?.some((admin) => admin.id === user.id) ?? false;
	const isCourseEditor = course.editors?.some((editor) => editor.id === user.id) ?? false;

	if (has == 'ProgramAdmin') return isProgramAdmin;
	if (has == 'ProgramAdminEditor') return isProgramAdmin || isProgramEditor;

	if (has == 'CourseAdminORProgramAdminEditor')
		return isCourseAdmin || isProgramAdmin || isProgramEditor;

	if (has == 'CourseAdminEditorORProgramAdminEditor')
		return isCourseAdmin || isCourseEditor || isProgramAdmin || isProgramEditor;

	return false;
}

export function hasSandboxPermissions(
	user: User,
	sandbox: SandboxPermissions,
	has: SandboxPermissionOptions
) {
	const isOwner = sandbox.owner?.id === user.id;
	const isEditor = sandbox.editors?.some((editor) => editor.id === user.id) ?? false;

	if (has == 'Owner') return isOwner;
	if (has == 'OwnerOREditor') return isOwner || isEditor;
	return false; // Never reached
}
