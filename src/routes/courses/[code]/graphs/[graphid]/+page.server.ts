import prisma from '$lib/server/db/prisma';
import { Domains, Subjects } from '$lib/server/helpers';
import { GraphValidator } from '$lib/server/validators/graphValidator';
import {
	changeDomainRelSchema,
	domainRelSchema,
	domainSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/zod/domainSubjectSchema';
import { error, type ServerLoad } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';

export const load = (async ({ params }) => {
	if (!params.code || !params.graphid) {
		error(400, { message: 'Course code and Graph id are required' });
	}

	const graphId = parseInt(params.graphid);
	// Check if graphId is not NaN
	if (isNaN(graphId)) {
		error(400, { message: 'Graph id must be a number' });
	}

	try {
		const course = await prisma.course.findFirst({
			where: {
				code: params.code
			},
			include: {
				graphs: {
					where: {
						id: graphId
					},
					include: {
						domains: {
							include: {
								incommingDomains: true,
								outgoingDomains: true
							}
						},
						subjects: {
							include: {
								incommingSubjects: true,
								outgoingSubjects: true,
								domain: true
							}
						},
						lectures: true
					}
				}
			}
		});

		if (!course) error(404, { message: 'Course not found' });
		if (course.graphs.length === 0) error(404, { message: 'Graph not found' });

		const graphValidator = new GraphValidator(course.graphs[0]);

		const cycles = graphValidator.hasCycle();

		// Happy path
		return {
			course: course,
			newDomainForm: await superValidate(zod(domainSchema)),
			newDomainRelForm: await superValidate(zod(domainRelSchema)),
			changeDomainRelForm: await superValidate(zod(changeDomainRelSchema)),
			newSubjectForm: await superValidate(zod(subjectSchema)),
			newSubjectRelForm: await superValidate(zod(subjectRelSchema)),
			cycles: cycles
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
}) satisfies ServerLoad;

// ACTIONS
export const actions = {
	'add-domain-to-graph': Domains.addDomainToGraph,
	'add-domain-rel': Domains.addDomainRel,
	'delete-domain-rel': Domains.deleteDomainRel,
	'change-domain-rel': Domains.changeDomainRel,

	/* MARK: SUBJECTS */
	'add-subject-to-graph': Subjects.addSubjectToGraph,
	'add-subject-rel': Subjects.addSubjectRel
};
