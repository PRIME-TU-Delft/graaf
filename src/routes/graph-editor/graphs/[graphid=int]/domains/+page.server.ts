import { DomainActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import { changeDomainRelSchema, domainRelSchema } from '$lib/valibot/domainSchema.js';
import type { ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';

export const load: ServerLoad = async () => {
	return {
		newDomainRelForm: await superValidate(valibot(domainRelSchema)),
		changeDomainRelForm: await superValidate(valibot(changeDomainRelSchema))
	};
};

// ACTIONS
export const actions = {
	// Domain relationships
	'add-domain-rel': async (event) => {
		const form = await superValidate(event, valibot(domainRelSchema));
		return DomainActions.addDomainRel(await getUser(event), form);
	},
	'change-domain-rel': async (event) => {
		const form = await superValidate(event, valibot(changeDomainRelSchema));
		return DomainActions.changeDomainRel(await getUser(event), form);
	},
	'delete-domain-rel': async (event) => {
		const form = await superValidate(event, valibot(domainRelSchema));
		return DomainActions.deleteDomainRel(await getUser(event), form);
	}
};
