import { DomainActions } from '$lib/server/actions';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

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
	'add-domain-to-graph': DomainActions.addDomainToGraph,
	'change-domain-in-graph': DomainActions.changeDomain,
	'delete-domain': DomainActions.deleteDomain,

	// Domain relationships
	'add-domain-rel': DomainActions.addDomainRel,
	'change-domain-rel': DomainActions.changeDomainRel,
	'delete-domain-rel': DomainActions.deleteDomainRel
};
