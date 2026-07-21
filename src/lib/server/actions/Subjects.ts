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

/** Server actions for creating, editing, and deleting subjects within a graph, and for
 * creating/removing relations between subjects. Called from form actions in `+page.server.ts`
 * route files, one static method per operation. */
export class SubjectActions {
	/**
	 * Create a new subject in a graph, appended to the end of the existing subject order, and
	 * optionally assign it to a domain. Unlike most other actions in this file, this does not
	 * check `form.valid` before using `form.data`.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, subject name, and domainId (0 means no
	 * domain)
	 * @returns Nothing on success. On a failed create, returns the form with a `name`-field error
	 * via setError instead of throwing.
	 */
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

	/**
	 * Delete a subject, first disconnecting it from every subject relation it participates in,
	 * all in a single transaction. Unlike most other actions in this file, this does not check
	 * `form.valid` before using `form.data`. The permission check happens on the delete query
	 * itself, so if it fails, the whole transaction (including the disconnects) is rolled back.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, subjectId to delete, and the ids of its
	 * source/target subject relations that need to be cleaned up
	 * @returns Nothing on success. On a failed transaction, returns the form with an error via
	 * setError instead of throwing.
	 */
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

	/**
	 * Rename a subject and/or reassign its domain.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, subjectId (must be non-zero), new name,
	 * and domainId (0 means no domain)
	 * @returns Nothing on success. On invalid input or missing permission, returns the form with
	 * a `name`-field error via setError instead of throwing.
	 */
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

	/**
	 * Create a directed relation between two subjects in the same graph (inId -> outId), used by
	 * both addSubjectRel and changeSubjectRel.
	 *
	 * @param graphId - The graph both subjects belong to
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param inId - The source subject id
	 * @param outId - The target subject id
	 * @returns The updated graph
	 * @throws If the subjects are already connected, or if the user lacks permission
	 */
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
	 * Create a directed relation between two subjects.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, sourceSubjectId, and targetSubjectId
	 * @returns Nothing on success. If the subjects are already connected or the user lacks
	 * permission, returns the form with an error via setError instead of throwing.
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

	/**
	 * Remove the directed relation between two subjects in the same graph, used by both
	 * deleteSubjectRel and changeSubjectRel.
	 *
	 * @param graphId - The graph both subjects belong to
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param inId - The source subject id
	 * @param outId - The target subject id
	 * @returns The updated graph
	 * @throws If the user lacks permission
	 */
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

	/**
	 * Remove the relation between two subjects.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, sourceSubjectId, and targetSubjectId
	 * @returns Nothing on success. On invalid input, returns the form with an error via setError.
	 * On a failed disconnect (e.g. missing permission), returns a SvelteKit `fail(500, ...)`
	 * response instead, unlike most other actions in this class.
	 */
	static async deleteSubjectRel(user: User, form: SuperValidated<Infer<typeof subjectRelSchema>>) {
		if (!form.valid) return setError(form, '', 'Invalid subject relationship');

		try {
			await SubjectActions.disconnectSubjects(
				form.data.graphId,
				user,
				form.data.sourceSubjectId,
				form.data.targetSubjectId
			);
		} catch (e: unknown) {
			// TODO: use setError here like the rest of this class, instead of fail(500, ...)
			return fail(500, { errorMessage: e instanceof Error ? e.message : `${e}` });
		}
	}

	/**
	 * Move a subject relation by disconnecting its old source/target pair and connecting the new
	 * one. Not atomic: if the connect step fails after the disconnect step succeeds, the old
	 * relation is not restored.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId, oldSourceSubjectId, oldTargetSubjectId,
	 * and the new sourceSubjectId/targetSubjectId
	 * @returns Nothing on success. On invalid input or a failed step, returns the form with an
	 * error via setError instead of throwing.
	 */
	static async changeSubjectRel(
		user: User,
		form: SuperValidated<Infer<typeof changeSubjectRelSchema>>
	) {
		if (!form.valid) return setError(form, '', form.message);

		// TODO: not atomic, if connectSubjects fails after disconnectSubjects succeeds the old
		// relation is not restored. Wrap both steps in a transaction.
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
