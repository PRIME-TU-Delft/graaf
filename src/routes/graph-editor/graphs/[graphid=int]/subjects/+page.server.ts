import prisma from '$lib/server/db/prisma';
import { whereHasCoursePermission } from '$lib/server/permissions';
import { SubjectActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import {
	changeSubjectRelSchema,
	deleteSubjectSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/zod/subjectSchema';
import { fail } from '@sveltejs/kit';
import type { User } from '@prisma/client';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

const reorderSchema = z.array(
	z.object({ subjectId: z.number().int(), newOrder: z.number().int() })
);

export const load: PageServerLoad = async () => {
	return {
		newSubjectForm: await superValidate(zod(subjectSchema)),
		deleteSubjectForm: await superValidate(zod(deleteSubjectSchema)),
		newSubjectRelForm: await superValidate(zod(subjectRelSchema)),
		changeSubjectRelForm: await superValidate(zod(changeSubjectRelSchema))
	};
};

export const actions: Actions = {
	'add-subject-to-graph': async (event) => {
		const form = await superValidate(event, zod(subjectSchema));
		return SubjectActions.addSubjectToGraph(await getUser(event), form);
	},
	'change-subject-in-graph': async (event) => {
		const form = await superValidate(event, zod(subjectSchema));
		return SubjectActions.changeSubject(await getUser(event), form);
	},
	'delete-subject': async (event) => {
		const form = await superValidate(event, zod(deleteSubjectSchema));
		return SubjectActions.deleteSubject(await getUser(event), form);
	},
	'add-subject-rel': async (event) => {
		const form = await superValidate(event, zod(subjectRelSchema));
		return SubjectActions.addSubjectRel(await getUser(event), form);
	},
	'change-subject-rel': async (event) => {
		const form = await superValidate(event, zod(changeSubjectRelSchema));
		return SubjectActions.changeSubjectRel(await getUser(event), form);
	},
	'delete-subject-rel': async (event) => {
		const form = await superValidate(event, zod(subjectRelSchema));
		return SubjectActions.deleteSubjectRel(await getUser(event), form);
	},
	reorderSubjects: async ({ request, locals }) => {
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
				parsed.data.map(({ subjectId, newOrder }) =>
					prisma.subject.update({
						where: {
							id: subjectId,
							graph: {
								course: {
									...whereHasCoursePermission(
										user,
										'CourseAdminEditorORProgramAdminEditor'
									)
								}
							}
						},
						data: { order: newOrder }
					})
				)
			);
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to reorder subjects' });
		}
	}
};
