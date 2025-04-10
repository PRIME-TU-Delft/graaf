import { fail } from '@sveltejs/kit';
import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { newCourseSchema, changePinSchema } from '$lib/zod/courseSchema';
import { whereHasProgramPermission } from '../permissions';

import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';
import type { linkingCoursesSchema } from '$lib/zod/superUserProgramSchema';

export class CourseActions {
	/**
	 * PERMISSIONS:
	 * - https://github.com/PRIME-TU-Delft/graaf/wiki/Permissions#c1
	 * - Either PROGRAM_ADMINS, PROGRAM_EDITOR and SUPER_ADMIN can add new courses
	 */
	static async newCourse(user: User, form: SuperValidated<Infer<typeof newCourseSchema>>) {
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

	static async changePin(user: User, form: SuperValidated<Infer<typeof changePinSchema>>) {
		if (!form.valid) return setError(form, '', 'form not valid');


		try {
			await prisma.user.update({
				where: {
					id: user.id
				},
				data: {
					pinned_courses: form.data.pin
						? {
								connect: {
									id: form.data.id
								}
							}
						: {
								disconnect: {
									id: form.data.id
								}
							}
				}
			});
		} catch (e) {
			return {
				error: e instanceof Error ? e.message : `${e}`
			};
		}

		return { form };
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
