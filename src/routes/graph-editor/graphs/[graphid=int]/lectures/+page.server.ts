import prisma from '$lib/server/db/prisma';
import { whereHasGraphCoursePermission } from '$lib/server/permissions';
import { LectureActions } from '$lib/server/actions/Lectures.js';
import { getUser } from '$lib/server/actions/Users.js';
import { deleteLectureSchema, lectureSchema } from '$lib/zod/lectureSchema';
import { fail } from '@sveltejs/kit';
import type { User } from '@prisma/client';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

const reorderSchema = z.array(
	z.object({ lectureId: z.number().int(), newOrder: z.number().int() })
);

export const load: PageServerLoad = async () => {
	return {
		newLectureForm: await superValidate(zod(lectureSchema)),
		deleteLectureForm: await superValidate(zod(deleteLectureSchema))
	};
};

export const actions: Actions = {
	'add-lecture-to-graph': async (event) => {
		const form = await superValidate(event, zod(lectureSchema));
		return LectureActions.addLectureToGraph(await getUser(event), form);
	},
	'link-subject-to-lecture': async (event) => {
		const form = await superValidate(event, zod(lectureSchema));
		return LectureActions.linkSubjectsToLecture(await getUser(event), form);
	},
	'change-lecture-name': async (event) => {
		const form = await superValidate(event, zod(lectureSchema));
		return LectureActions.changeLectureName(await getUser(event), form);
	},
	'delete-lecture': async (event) => {
		const form = await superValidate(event, zod(deleteLectureSchema));
		return LectureActions.deleteLecture(await getUser(event), form);
	},
	reorderLectures: async ({ request, locals }) => {
		const session = await locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const raw = formData.get('order');
		if (typeof raw !== 'string') return fail(400, { error: 'Missing order data' });

		const parsed = reorderSchema.safeParse(JSON.parse(raw));
		if (!parsed.success) return fail(400, { error: 'Invalid order data' });

		try {
			await prisma.$transaction(
				parsed.data.map(({ lectureId, newOrder }) =>
					prisma.lecture.update({
						where: {
							id: lectureId,
							graph: {
								...whereHasGraphCoursePermission(
									user,
									'CourseAdminEditorORProgramAdminEditor'
								)
							}
						},
						data: { order: newOrder }
					})
				)
			);
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to reorder lectures' });
		}
	}
};
