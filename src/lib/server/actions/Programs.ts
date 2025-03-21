import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { courseSchema } from '$lib/zod/courseSchema';
import { programSchema } from '$lib/zod/programSchema';
import { whereHasProgramPermission } from '../permissions';
import { fail, redirect, type RequestEvent } from '@sveltejs/kit';

import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { User } from '@prisma/client';

import type {
	deleteProgramSchema,
	editProgramSchema,
	editSuperUserSchema,
	linkingCoursesSchema
} from '$lib/zod/superUserProgramSchema';

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
					...whereHasProgramPermission(user, 'ProgramAdminEditor') // All super users can create a new course
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
		} catch {
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
		// TODO: make this into a superform
		const programId = formData.get('program-id') as number | null;
		const courseCode = formData.get('code') as string | null;
		const courseName = formData.get('name') as string | null;

		if (!programId || !courseCode || !courseName)
			return fail(400, { error: 'Missing required fields' });

		try {
			await prisma.program.update({
				where: {
					id: programId,
					...whereHasProgramPermission(user, 'ProgramAdminEditor') // User is either an admin or editor or SUPER_ADMIN
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
		if (admins.length >= 1) return {};

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
					...whereHasProgramPermission(user, 'ProgramAdmin') // Only admins can link/unlink courses
				},
				data: {
					courses: {
						...linkMode()
					}
				}
			});
		} catch {
			return setError(formData, '', "You don't have permission to link/unlink courses");
		}
	}
}
