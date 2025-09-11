import { SubjectActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import {
	changeSubjectRelSchema,
	deleteSubjectSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/valibot/subjectSchema';
import type { ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

export const load: ServerLoad = async () => {
	return {
		newSubjectForm: await superValidate(valibot(subjectSchema)),
		deleteSubjectForm: await superValidate(valibot(deleteSubjectSchema)),
		newSubjectRelForm: await superValidate(valibot(subjectRelSchema)),
		changeSubjectRelForm: await superValidate(valibot(changeSubjectRelSchema))
	};
};

// ACTIONS
export const actions = {
	'add-subject-to-graph': async (event) => {
		const form = await superValidate(event, valibot(subjectSchema));
		return SubjectActions.addSubjectToGraph(await getUser(event), form);
	},
	'change-subject-in-graph': async (event) => {
		const form = await superValidate(event, valibot(subjectSchema));
		return SubjectActions.changeSubject(await getUser(event), form);
	},
	'delete-subject': async (event) => {
		const form = await superValidate(event, valibot(deleteSubjectSchema));
		return SubjectActions.deleteSubject(await getUser(event), form);
	},
	'add-subject-rel': async (event) => {
		const form = await superValidate(event, valibot(subjectRelSchema));
		return SubjectActions.addSubjectRel(await getUser(event), form);
	},
	'change-subject-rel': async (event) => {
		const form = await superValidate(event, valibot(changeSubjectRelSchema));
		return SubjectActions.changeSubjectRel(await getUser(event), form);
	},
	'delete-subject-rel': async (event) => {
		const form = await superValidate(event, valibot(subjectRelSchema));
		return SubjectActions.deleteSubjectRel(await getUser(event), form);
	}
};
