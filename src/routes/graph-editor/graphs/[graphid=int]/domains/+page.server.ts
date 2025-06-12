import { DomainActions } from '$lib/server/actions';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { getUser } from '$lib/server/actions/Users';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema
} from '$lib/zod/domainSchema.js';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async () => {
	return {
		newDomainForm: await superValidate(zod(domainSchema)),
		deleteDomainForm: await superValidate(zod(deleteDomainSchema)),
		newDomainRelForm: await superValidate(zod(domainRelSchema)),
		changeDomainRelForm: await superValidate(zod(changeDomainRelSchema))
	};
};

// ACTIONS
export const actions = {
	'add-domain-to-graph': async (event) => {
		const form = await superValidate(event, zod(domainSchema));
		return DomainActions.addDomainToGraph(await getUser(event), form);
	},
	'change-domain-in-graph': async (event) => {
		const form = await superValidate(event, zod(domainSchema));
		return DomainActions.changeDomain(await getUser(event), form);
	},
	'delete-domain': async (event) => {
		const form = await superValidate(event, zod(deleteDomainSchema));
		return DomainActions.deleteDomain(await getUser(event), form);
	},

	// Domain relationships
	'add-domain-rel': async (event) => {
		const form = await superValidate(event, zod(domainRelSchema));
		return DomainActions.addDomainRel(await getUser(event), form);
	},
	'change-domain-rel': async (event) => {
		const form = await superValidate(event, zod(changeDomainRelSchema));
		return DomainActions.changeDomainRel(await getUser(event), form);
	},
	'delete-domain-rel': async (event) => {
		const form = await superValidate(event, zod(domainRelSchema));
		return DomainActions.deleteDomainRel(await getUser(event), form);
	}
};
