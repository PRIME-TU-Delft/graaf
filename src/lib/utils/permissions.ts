import type { User } from '@prisma/client';

type ProgramsPermission = {
	editors?: { id: string }[];
	admins?: { id: string }[];
};

type CoursePermissions = {
	editors?: { id: string }[];
	admins?: { id: string }[];
	programs: ProgramsPermission[];
};

export type ProgramPermissionsOptions = 'OnlySuperAdmin' | 'ProgramAdmin' | 'ProgramAdminEditor';

export type CoursePermissionsOptions =
	| ProgramPermissionsOptions
	| 'CourseAdminORProgramAdminEditor'
	| 'CourseAdminEditorORProgramAdminEditor';

export function hasProgramPermissions(
	user: User,
	program: ProgramsPermission,
	has: ProgramPermissionsOptions
) {
	// If the user is a super-admin, they can edit any course. Thus no special where permission is required
	if (user.role == 'ADMIN') return true;
	else if (has === 'OnlySuperAdmin') return false;

	const isProgramAdmin = program.admins?.some((admin) => admin.id === user.id) ?? false;
	const isProgramEditor = program.editors?.some((editor) => editor.id === user.id) ?? false;

	if (has == 'ProgramAdmin') return isProgramAdmin;
	if (has == 'ProgramAdminEditor') return isProgramAdmin || isProgramEditor;
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
