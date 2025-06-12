import { SubjectActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
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
	}
};
