import prisma from '$lib/server/db/prisma';
import {
	changeSubjectRelSchema,
	deleteSubjectSchema,
	subjectRelSchema,
	subjectSchema
} from '$lib/zod/subjectSchema';
import type { User } from '@prisma/client';
import { fail, setError, type Infer, type SuperValidated } from 'sveltekit-superforms';
import { whereHasGraphCoursePermission } from '../permissions';

export class SubjectActions {
	/**
	 * Adds a subject to the graph based on the provided event.
	 *
	 * @returns A promise that resolves to an error message if the form is invalid.
	 * @throws Will throw an error if there is an issue with the database transaction.
	 *
	 * The function performs the following steps:
	 * 1. Validates the form data using `superValidate` and `zod(subjectSchema)`.
	 * 2. Adds the subject to the graph
	 * 3. If the domainId is greater than 0 (0 means no value was given in the form),
	 *      adds the subject to the domain.
	 * 4. If there is an error, returns the error message.
	 * 5. If successful, returns the subject.
	 **/

	static async addSubjectToGraph(user: User, form: SuperValidated<Infer<typeof subjectSchema>>) {
		try {
			const lastSubject = await prisma.subject.findFirst({
				where: {
					graphId: form.data.graphId
				},
				orderBy: {
					order: 'desc'
				}
			});

			await prisma.graph.update({
				where: {
					id: form.data.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					subjects: {
						create: {
							name: form.data.name,
							order: lastSubject ? lastSubject.order + 1 : 0,
							domainId: form.data.domainId > 0 ? form.data.domainId : null
						}
					}
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async deleteSubject(user: User, form: SuperValidated<Infer<typeof deleteSubjectSchema>>) {
		const removeTargetFromSource = form.data.sourceSubjects.map((id) => {
			return prisma.subject.update({
				where: { id },
				data: {
					targetSubjects: {
						disconnect: { id: form.data.subjectId }
					}
				}
			});
		});

		const removeSourceFromTarget = form.data.targetSubjects.map((id) => {
			return prisma.subject.update({
				where: { id },
				data: {
					sourceSubjects: {
						disconnect: { id: form.data.subjectId }
					}
				}
			});
		});

		// When permissions fail for this query all other queries will fail as well and rollback
		const deleteSubject = prisma.graph.update({
			where: {
				id: form.data.graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				subjects: {
					delete: { id: form.data.subjectId }
				}
			}
		});

		try {
			await prisma.$transaction([
				...removeTargetFromSource,
				...removeSourceFromTarget,
				deleteSubject
			]);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async changeSubject(user: User, form: SuperValidated<Infer<typeof subjectSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid subject');
		if (form.data.subjectId === 0) {
			return setError(form, 'name', 'Invalid subject id, cannot be 0');
		}

		try {
			await prisma.graph.update({
				where: {
					id: form.data.graphId,
					...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					subjects: {
						update: {
							where: { id: form.data.subjectId },
							data: {
								name: form.data.name,
								domainId: form.data.domainId > 0 ? form.data.domainId : null
							}
						}
					}
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	private static async connectSubjects(graphId: number, user: User, inId: number, outId: number) {
		// Check if the subjecs are already connected
		const isConnected = await prisma.subject.findFirst({
			where: {
				id: inId,
				targetSubjects: { some: { id: outId } }
			}
		});

		if (isConnected) {
			throw new Error('Subjects are already connected');
		}

		return await prisma.graph.update({
			where: {
				// Assuming both subjects belong to the same graph, use the graphId from one of the domains
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				subjects: {
					update: [
						{
							where: { id: inId },
							data: {
								targetSubjects: { connect: { id: outId } }
							}
						},
						{
							where: { id: outId },
							data: {
								sourceSubjects: { connect: { id: inId } }
							}
						}
					]
				}
			}
		});
	}

	/**
	 * Adds a relationship between two subjects based on the provided event.
	 *
	 * @returns A promise that resolves to an error message if the form is invalid or if the subjects are already connected.
	 * @throws Will throw an error if there is an issue with the database transaction.
	 *
	 * The function performs the following steps:
	 * 1. Validates the form data using `superValidate` and `zod(subjectRelSchema)`.
	 * 2. Checks if the subjects are already connected.
	 * 3. If not connected, updates the subjects to connect them in both directions.
	 * 4. Executes the updates within a database transaction.
	 */

	static async addSubjectRel(user: User, form: SuperValidated<Infer<typeof subjectRelSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid subject relationship');

		try {
			const sourceId = form.data.sourceSubjectId;
			const targetId = form.data.targetSubjectId;
			await SubjectActions.connectSubjects(form.data.graphId, user, sourceId, targetId);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}

	private static async disconnectSubjects(
		graphId: number,
		user: User,
		inId: number,
		outId: number
	) {
		return await prisma.graph.update({
			where: {
				// Assuming both subjects belong to the same graph, use the graphId from one of the domains
				id: graphId,
				...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
			},
			data: {
				subjects: {
					update: [
						{
							where: { id: inId },
							data: {
								targetSubjects: { disconnect: { id: outId } }
							}
						},
						{
							where: { id: outId },
							data: {
								sourceSubjects: { disconnect: { id: inId } }
							}
						}
					]
				}
			}
		});
	}

	static async deleteSubjectRel(user: User, form: SuperValidated<Infer<typeof subjectRelSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid subject relationship');

		console.log(form);

		try {
			await SubjectActions.disconnectSubjects(
				form.data.graphId,
				user,
				form.data.sourceSubjectId,
				form.data.targetSubjectId
			);
		} catch (e: unknown) {
			return fail(500, { errorMessage: e instanceof Error ? e.message : `${e}` });
		}
	}

	static async changeSubjectRel(
		user: User,
		form: SuperValidated<Infer<typeof changeSubjectRelSchema>>
	) {
		if (!form.valid) return setError(form, '', form.message);

		try {
			await SubjectActions.disconnectSubjects(
				form.data.graphId,
				user,
				form.data.oldSourceSubjectId,
				form.data.oldTargetSubjectId
			);
			await SubjectActions.connectSubjects(
				form.data.graphId,
				user,
				form.data.sourceSubjectId,
				form.data.targetSubjectId
			);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
