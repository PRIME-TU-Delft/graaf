import prisma from '$lib/server/db/prisma.js';
import { emptyPrismaPromise } from '$lib/utils.js';
import type { Course, User } from '@prisma/client';
import { fail, setError, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from '../$types.js';
import { courseSchema, programSchema } from '../../lib/zod/programCourseSchema.js';

export const load = (async ({ url, locals }) => {
	try {
		const search = url.searchParams.get('c')?.toLocaleLowerCase();

		const programs = await prisma.program.findMany({
			include: {
				courses: {
					orderBy: {
						updatedAt: 'desc'
					},
					where: search
						? { name: { contains: search, mode: 'insensitive' } }
						: { NOT: { name: '' } }
				},
				editors: true,
				admins: true
			},
			orderBy: {
				updatedAt: 'desc'
			}
		});

		// Check if we need pagination here
		const courses = prisma.course.findMany({
			orderBy: {
				updatedAt: 'desc'
			}
		});

		const session = await locals.auth();
		const user = session?.user as User | undefined;

		if (!user) throw new Error('No user found');

		return {
			error: undefined,
			programs,
			courses,
			user,
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	} catch (e: unknown) {
		return {
			error: e instanceof Error ? e.message : `${e}`,
			programs: [],
			user: undefined,
			courses: emptyPrismaPromise([] as Course[]),
			programForm: await superValidate(zod(programSchema)),
			courseForm: await superValidate(zod(courseSchema))
		};
	}
}) satisfies PageServerLoad;

export const actions = {
	// Creates a new program with the given name
	'new-program': async (event) => {
		const form = await superValidate(event, zod(programSchema));

		// Check if user is a super admin
		const session = await event.locals.auth();

		if ((session?.user as User)?.role !== 'ADMIN') {
			return fail(403, { form, error: 'You do not have permission to perform this action' });
		}
		if (!form.valid) {
			return fail(400, { form });
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

		return {
			form
		};
	},

	// Creates a new course with the given NAME and CODE
	'new-course': async (event) => {
		const form = await superValidate(event, zod(courseSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		// Check permissions
		const session = await event.locals.auth();
		if (!session) return fail(500, { error: 'no session found' });

		const user = session.user as User;

		const hasPermission = [
			{
				editors: {
					some: {
						id: user.id
					}
				}
			},
			{
				admins: {
					some: {
						id: user.id
					}
				}
			}
		];

		try {
			await prisma.program.update({
				where: {
					id: form.data.programId,
					OR: user.role === 'ADMIN' ? [] : hasPermission
				},
				data: {
					updatedAt: new Date(),
					courses: {
						create: {
							name: form.data.name,
							code: form.data.code
						}
					}
				}
			});
		} catch (e) {
			if (!(e instanceof Object) || !('message' in e)) {
				return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
			}

			return setError(form, 'name', `${e.message}`);
		}

		return {
			form
		};
	},

	'add-course-to-program': async (event) => {
		const form = await event.request.formData();

		const programId = form.get('program-id') as string | null;
		const courseCode = form.get('code') as string | null;
		const courseName = form.get('name') as string | null;

		if (!programId || !courseCode || !courseName) {
			return fail(400, { error: 'Missing required fields' });
		}

		// Check permissions
		const session = await event.locals.auth();
		if (!session) return fail(500, { error: 'no session found' });

		const user = session.user as User;

		const hasPermission = [
			{
				editors: {
					some: {
						id: user.id
					}
				}
			},
			{
				admins: {
					some: {
						id: user.id
					}
				}
			}
		];

		try {
			await prisma.program.update({
				where: {
					id: programId,
					OR: user.role === 'ADMIN' ? [] : hasPermission
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
} satisfies Actions;
