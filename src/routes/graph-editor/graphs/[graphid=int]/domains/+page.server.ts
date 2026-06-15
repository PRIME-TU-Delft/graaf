import prisma from '$lib/server/db/prisma';
import { whereHasCoursePermission } from '$lib/server/permissions';
import { DomainActions } from '$lib/server/actions';
import { getUser } from '$lib/server/actions/Users';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	domainRelSchema,
	domainSchema
} from '$lib/zod/domainSchema.js';
import { fail } from '@sveltejs/kit';
import type { User } from '@prisma/client';
import { z } from 'zod';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';

const reorderSchema = z.array(
	z.object({ domainId: z.number().int(), newOrder: z.number().int() })
);

export const load: PageServerLoad = async () => {
	return {
		newDomainForm: await superValidate(zod(domainSchema)),
		deleteDomainForm: await superValidate(zod(deleteDomainSchema)),
		newDomainRelForm: await superValidate(zod(domainRelSchema)),
		changeDomainRelForm: await superValidate(zod(changeDomainRelSchema))
	};
};

export const actions: Actions = {
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
	},
	reorderDomains: async ({ request, locals }) => {
		const session = await locals.auth();
		const user = session?.user as User | undefined;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const raw = formData.get('order');
		if (typeof raw !== 'string') return fail(400, { error: 'Missing order data' });

		const parsed = reorderSchema.safeParse(JSON.parse(raw));
		if (!parsed.success) return fail(400, { error: 'Invalid order data' });

		try {
			await prisma.$transaction(
				parsed.data.map(({ domainId, newOrder }) =>
					prisma.domain.update({
						where: {
							id: domainId,
							graph: {
								course: {
									...whereHasCoursePermission(
										user,
										'CourseAdminEditorORProgramAdminEditor'
									)
								}
							}
						},
						data: { order: newOrder }
					})
				)
			);
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to reorder domains' });
		}
	}
};
