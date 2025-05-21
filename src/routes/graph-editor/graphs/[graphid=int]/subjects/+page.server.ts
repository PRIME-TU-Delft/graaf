import { SubjectActions } from '$lib/server/actions';
import {
	changeSubjectRelSchema,
	deleteSubjectSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/zod/subjectSchema';
import type { ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load: ServerLoad = async () => {
	return {
		newSubjectForm: await superValidate(zod(subjectSchema)),
		deleteSubjectForm: await superValidate(zod(deleteSubjectSchema)),
		newSubjectRelForm: await superValidate(zod(subjectRelSchema)),
		changeSubjectRelForm: await superValidate(zod(changeSubjectRelSchema))
	};
};

// ACTIONS
export const actions = {
	'add-subject-to-graph': SubjectActions.addSubjectToGraph,
	'change-subject-in-graph': SubjectActions.changeSubject,
	'delete-subject': SubjectActions.deleteSubject,

	'add-subject-rel': SubjectActions.addSubjectRel,
	'change-subject-rel': SubjectActions.changeSubjectRel,
	'delete-subject-rel': SubjectActions.deleteSubjectRel
};
