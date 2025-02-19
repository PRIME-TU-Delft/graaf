import prisma from '$lib/server/db/prisma';
import { DomainActions, SubjectActions } from '$lib/server/helpers';
import { GraphValidator } from '$lib/validators/graphValidator';
import {
	changeDomainRelSchema,
	deleteDomainSchema,
	deleteSubjectSchema,
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
							},
							orderBy: {
								order: 'asc'
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
			deleteDomainForm: await superValidate(zod(deleteDomainSchema)),
			newDomainRelForm: await superValidate(zod(domainRelSchema)),
			changeDomainRelForm: await superValidate(zod(changeDomainRelSchema)),

			newSubjectForm: await superValidate(zod(subjectSchema)),
			deleteSubjectForm: await superValidate(zod(deleteSubjectSchema)),
			newSubjectRelForm: await superValidate(zod(subjectRelSchema)),

			cycles: cycles
		};
	} catch (e: unknown) {
		error(500, { message: e instanceof Error ? e.message : `${e}` });
	}
}) satisfies ServerLoad;

// ACTIONS
export const actions = {
	'add-domain-to-graph': DomainActions.addDomainToGraph,
	'change-domain-in-graph': DomainActions.changeDomain,
	'delete-domain': DomainActions.deleteDomain,

	// Domain relationships
	'add-domain-rel': DomainActions.addDomainRel,
	'change-domain-rel': DomainActions.changeDomainRel,
	'delete-domain-rel': DomainActions.deleteDomainRel,

	/* MARK: SUBJECTS */
	'add-subject-to-graph': SubjectActions.addSubjectToGraph,
	'change-subject-in-graph': SubjectActions.changeSubject,
	'delete-subject': SubjectActions.deleteSubject,

	'add-subject-rel': SubjectActions.addSubjectRel
};
