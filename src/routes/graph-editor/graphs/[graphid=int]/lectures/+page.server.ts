import { LectureActions } from '$lib/server/actions/Lectures.js';
import { getUser } from '$lib/server/actions/Users.js';
import { deleteLectureSchema, lectureSchema } from '$lib/zod/lectureSchema';
import type { ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load: ServerLoad = async () => {
	return {
		newLectureForm: await superValidate(zod(lectureSchema)),
		deleteLectureForm: await superValidate(zod(deleteLectureSchema))
	};
};

export const actions = {
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
	}
};
