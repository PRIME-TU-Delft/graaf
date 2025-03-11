import { setError } from '$lib/utils/setError';
import { courseSchema, programSchema } from '$lib/zod/programCourseSchema';
import type { User } from '@prisma/client';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import prisma from '../db/prisma';
import type {
	deleteProgramSchema,
	editSuperUserSchema,
	linkingCoursesSchema
} from '$lib/zod/superUserProgramSchema';

type PermissionsOptions = {
	admin: boolean;
	editor: boolean;
	superAdmin: boolean;
};

/**
 * Check if the user has permissions to edit the program
 * @param user - User
 * @param options - PermissionsOptions
 * @returns A json object that can be used in a Prisma where query
 * @example
 * const user = { id: 1, role: 'ADMIN' };
 * const permissions = hasProgramPermissions(user, { admin: true, editor: true, superAdmin: true });
 * const program = await prisma.program.findFirst({ where: { id: 1, ...permissions } });
 */
export function hasProgramPermissions(
	user: User,
	options: PermissionsOptions = { admin: true, editor: true, superAdmin: true }
) {
	// If the user is a super-admin, they can edit any program. Thus no special where permission is required
	if (options.superAdmin && user.role == 'ADMIN') return {};

	// If no permissions are set, return empty permissions
	if (!options.admin && !options.editor) return {};

	const hasEditorPermission = { editors: { some: { id: user.id } } };
	const hasAdminPermission = { admins: { some: { id: user.id } } };

	const hasPermission: (typeof hasEditorPermission | typeof hasAdminPermission)[] = [];
	if (options.editor) hasPermission.push(hasEditorPermission);
	if (options.admin) hasPermission.push(hasAdminPermission);

	return { OR: hasPermission };
}

export class ProgramActions {
	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#p2
	 * - Only super admins can add new programs
	 */
	static async newProgram(event: RequestEvent, form: SuperValidated<Infer<typeof programSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		// Check if user is a super admin, otherwise return an error
		const session = await event.locals.auth();
		if ((session?.user as User)?.role !== 'ADMIN') {
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
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#c1
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 */
	static async newCourse(user: User, form: SuperValidated<Infer<typeof courseSchema>>) {
		if (!form.valid) return setError(form, '', 'Form is not valid');

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId,
					...hasProgramPermissions(user) // User is either an admin or editor or SUPER_ADMIN
				},
				data: {
					updatedAt: new Date(),
					courses: {
						create: {
							name: form.data.name,
							code: form.data.code,
							pinnedBy: {
								connect: {
									id: user.id
								}
							}
						}
					}
				}
			});
		} catch (e) {
			return setError(form, 'name', 'Unauthorized');
		}

		return {
			form
		};
	}

	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#p5
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 */
	static async addCourseToProgram(user: User, formData: FormData) {
		const programId = formData.get('program-id') as string | null;
		const courseCode = formData.get('code') as string | null;
		const courseName = formData.get('name') as string | null;

		if (!programId || !courseCode || !courseName)
			return fail(400, { error: 'Missing required fields' });

		try {
			await prisma.program.update({
				where: {
					id: programId,
					...hasProgramPermissions(user) // User is either an admin or editor or SUPER_ADMIN
				},
				data: {
					updatedAt: new Date(),
					courses: {
						connect: {
							code: courseCode
						}
					}
				}
			});
		} catch (e) {
			return fail(500, { error: e instanceof Error ? e.message : `${e}` });
		}
	}

	static async deleteProgram(
		user: User,
		formData: SuperValidated<Infer<typeof deleteProgramSchema>>
	) {
		try {
			await prisma.program.delete({
				where: {
					id: formData.data.programId,
					...hasProgramPermissions(user, { superAdmin: true, admin: false, editor: false })
				}
			});
		} catch (e: unknown) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		throw redirect(303, '/');
	}

	static async editSuperUser(
		user: User,
		formData: SuperValidated<Infer<typeof editSuperUserSchema>>
	) {
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
			await prisma.program.update({
				where: {
					id: formData.data.programId,
					// When we want to add a new admin, we need to check if the user is an program admin or super admin
					// When we want to revoke admin rights, the user needs to be a program admin or super admin
					...hasProgramPermissions(user, {
						superAdmin: true,
						admin: newRole == 'admin' || newRole == 'revoke',
						editor: false
					})
				},
				data: getData()
			});
		} catch (e: unknown) {
			return setError(formData, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async linkCourses(
		user: User,
		formData: SuperValidated<Infer<typeof linkingCoursesSchema>>,
		options: { link: boolean } = { link: true }
	) {
		if (!formData.valid) return setError(formData, '', 'form not valid');

		function linkMode() {
			const codes = formData.data.courseCodes.map((code) => ({ code }));
			if (options.link) return { connect: codes };
			else return { disconnect: codes };
		}

		try {
			await prisma.program.update({
				where: {
					id: formData.data.programId,
					...hasProgramPermissions(user) // all super admins can unlink courses
				},
				data: {
					courses: {
						...linkMode()
					}
				}
			});
		} catch (e: unknown) {
			return setError(formData, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
