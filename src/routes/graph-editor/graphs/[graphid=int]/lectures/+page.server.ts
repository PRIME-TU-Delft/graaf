import { LectureActions } from '$lib/server/actions/Lectures.js';
import { getUser } from '$lib/server/actions/Users.js';
import {
	deleteLectureSchema,
	lectureSchema,
	reorderLectureSubjectsSchema,
	reorderLecturesSchema
} from '$lib/zod/lectureSchema';
import { nodePositionActions } from '../nodePositions';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ params }) => {
	return {
		// Just this page's crumb; NavigationBar appends it to the trail the layout built. Kept out
		// of the layout load (and out of `await parent()`, which would force that load to re-run)
		// so switching tabs doesn't refetch the graph and rebuild the canvas.
		breadcrumbLeaf: { name: 'Lectures', url: `/graph-editor/graphs/${params.graphid}/lectures` },
		newLectureForm: await superValidate(zod(lectureSchema)),
		deleteLectureForm: await superValidate(zod(deleteLectureSchema)),
		reorderLecturesForm: await superValidate(zod(reorderLecturesSchema)),
		reorderLectureSubjectsForm: await superValidate(zod(reorderLectureSubjectsSchema))
	};
};

export const actions = {
	...nodePositionActions,
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
	'reorder-lectures': async (event) => {
		const form = await superValidate(event, zod(reorderLecturesSchema));
		return LectureActions.reorderLectures(await getUser(event), form);
	},
	'reorder-lecture-subjects': async (event) => {
		const form = await superValidate(event, zod(reorderLectureSubjectsSchema));
		return LectureActions.reorderLectureSubjects(await getUser(event), form);
	},
	'delete-lecture': async (event) => {
		const form = await superValidate(event, zod(deleteLectureSchema));
		return LectureActions.deleteLecture(await getUser(event), form);
	}
};
