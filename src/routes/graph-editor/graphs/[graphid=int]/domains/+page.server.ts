import { DomainActions } from '$lib/server/actions';
import { superValidate } from 'sveltekit-superforms';
import { valibot } from 'sveltekit-superforms/adapters';
import { getUser } from '$lib/server/actions/Users';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema
} from '$lib/valibot/domainSchema.js';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async () => {
	return {
		newDomainForm: await superValidate(valibot(domainSchema)),
		deleteDomainForm: await superValidate(valibot(deleteDomainSchema)),
		newDomainRelForm: await superValidate(valibot(domainRelSchema)),
		changeDomainRelForm: await superValidate(valibot(changeDomainRelSchema))
	};
};

// ACTIONS
export const actions = {
	'change-domain-in-graph': async (event) => {
		const form = await superValidate(event, valibot(domainSchema));
		return DomainActions.changeDomain(await getUser(event), form);
	},
	'delete-domain': async (event) => {
		const form = await superValidate(event, valibot(deleteDomainSchema));
		return DomainActions.deleteDomain(await getUser(event), form);
	},

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
