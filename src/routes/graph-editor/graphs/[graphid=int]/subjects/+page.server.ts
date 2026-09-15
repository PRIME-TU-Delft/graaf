import { SubjectActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import {
	changeSubjectRelSchema,
	deleteSubjectSchema,
	reorderSubjectsSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/zod/subjectSchema';
import { nodePositionActions } from '../nodePositions';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async ({ params }) => {
	return {
		// Just this page's crumb; NavigationBar appends it to the trail the layout built. Kept out
		// of the layout load (and out of `await parent()`, which would force that load to re-run)
		// so switching tabs doesn't refetch the graph and rebuild the canvas.
		breadcrumbLeaf: { name: 'Subjects', url: `/graph-editor/graphs/${params.graphid}/subjects` },
		newSubjectForm: await superValidate(zod(subjectSchema)),
		deleteSubjectForm: await superValidate(zod(deleteSubjectSchema)),
		newSubjectRelForm: await superValidate(zod(subjectRelSchema)),
		changeSubjectRelForm: await superValidate(zod(changeSubjectRelSchema)),
		reorderSubjectsForm: await superValidate(zod(reorderSubjectsSchema))
	};
};

// ACTIONS
export const actions = {
	...nodePositionActions,
	'add-subject-to-graph': async (event) => {
		const form = await superValidate(event, zod(subjectSchema));
		return SubjectActions.addSubjectToGraph(await getUser(event), form);
	},
	'change-subject-in-graph': async (event) => {
		const form = await superValidate(event, zod(subjectSchema));
		return SubjectActions.changeSubject(await getUser(event), form);
	},
	'reorder-subjects': async (event) => {
		const form = await superValidate(event, zod(reorderSubjectsSchema));
		return SubjectActions.reorderSubjects(await getUser(event), form);
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
	}
};
