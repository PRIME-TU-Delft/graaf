import { CourseActions } from '$lib/server/actions/Courses';
import { getUser } from '$lib/server/actions/Users';
import prisma from '$lib/server/db/prisma';
import { changePinSchema } from '$lib/zod/courseSchema';
import type { Actions, ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = (async () => {
	const courses = await prisma.course.findMany({
		orderBy: {
			name: 'asc'
		},
		include: {
			pinnedBy: true,
			programs: {
				include: {
					admins: true,
					editors: true
				}
			},
			admins: true,
			editors: true,
			_count: {
				select: {
					graphs: true,
					links: true
				}
			}
		}
	});

	return {
		courses,
		coursePinnedForm: await superValidate(zod(changePinSchema))
	};
}) satisfies ServerLoad;

export const actions = {
	'change-course-pin': async (event) => {
		const form = await superValidate(event, zod(changePinSchema));
		return CourseActions.changePin(await getUser(event), form);
	}
} satisfies Actions;
