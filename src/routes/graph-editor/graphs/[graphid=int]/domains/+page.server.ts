import { DomainActions } from '$lib/server/actions';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { getUser } from '$lib/server/actions/Users';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema,
	domainStyleSchema,
	reorderDomainsSchema
} from '$lib/zod/domainSchema.js';
import { nodePositionActions } from '../nodePositions';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		// Just this page's crumb; NavigationBar appends it to the trail the layout built. Kept out
		// of the layout load (and out of `await parent()`, which would force that load to re-run)
		// so switching tabs doesn't refetch the graph and rebuild the canvas.
		breadcrumbLeaf: { name: 'Domains', url: `/graph-editor/graphs/${params.graphid}/domains` },
		newDomainForm: await superValidate(zod(domainSchema)),
		deleteDomainForm: await superValidate(zod(deleteDomainSchema)),
		newDomainRelForm: await superValidate(zod(domainRelSchema)),
		changeDomainRelForm: await superValidate(zod(changeDomainRelSchema)),
		reorderDomainsForm: await superValidate(zod(reorderDomainsSchema)),
		domainStyleForm: await superValidate(zod(domainStyleSchema))
	};
};

// ACTIONS
export const actions = {
	...nodePositionActions,
	'add-domain-to-graph': async (event) => {
		const form = await superValidate(event, zod(domainSchema));
		return DomainActions.addDomainToGraph(await getUser(event), form);
	},
	'change-domain-in-graph': async (event) => {
		const form = await superValidate(event, zod(domainSchema));
		return DomainActions.changeDomain(await getUser(event), form);
	},
	'change-domain-style': async (event) => {
		const form = await superValidate(event, zod(domainStyleSchema));
		return DomainActions.changeDomainStyle(await getUser(event), form);
	},
	'reorder-domains': async (event) => {
		const form = await superValidate(event, zod(reorderDomainsSchema));
		return DomainActions.reorderDomains(await getUser(event), form);
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
