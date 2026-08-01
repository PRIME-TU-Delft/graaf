import { env } from '$env/dynamic/private';
import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { Prisma } from '@prisma/client';
import { whereHasCoursePermission, whereHasSandboxPermission } from '../permissions';

import type { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';

import type { User } from '@prisma/client';
import type { FormPathLeavesWithErrors, Infer, SuperValidated } from 'sveltekit-superforms';

/** Server actions for creating, moving, and deleting shareable graph links under a course or
 * sandbox. Called from form actions in `+page.server.ts` route files, one static method per
 * operation. */
export class LinkActions {
	/**
	 * Await a course-scoped Prisma write and translate a permission failure into a form error.
	 * Shared by every action in this class that mutates a link through its parent course.
	 *
	 * @param query - The in-flight Prisma query (e.g. `prisma.course.update(...)`) to await
	 * @param form - The form to attach an error to if the query fails
	 * @param path - The form field to attach the error to
	 * @returns `{ form }` on success. If the query fails because the course wasn't found under
	 * the permission-scoped where clause, sets a permission-denied message; otherwise sets the
	 * underlying error message. Either way returns the form via setError instead of throwing.
	 */
	private static async updateCourse<T, S extends Record<string, unknown>>(
		query: T,
		form: SuperValidated<S>,
		path: FormPathLeavesWithErrors<S>
	) {
		try {
			await query;
		} catch (e: unknown) {
			if (env.DEBUG) console.error(e);

			if (
				e instanceof Prisma.PrismaClientKnownRequestError &&
				e.meta &&
				'cause' in e.meta &&
				e.meta.cause instanceof String &&
				(e.meta.cause as string).includes("No 'Course' record")
			) {
				return setError(
					form,
					path,
					'You are not allowed to edit this course. You are not an program admin/editor or course admin/editor'
				);
			}

			return setError(form, path, e instanceof Error ? e.message : `${e}`);
		}

		return { form };
	}

	/**
	 * Await a sandbox-scoped Prisma write and translate a permission failure into a form error.
	 * The sandbox equivalent of updateCourse.
	 *
	 * @param query - The in-flight Prisma query (e.g. `prisma.sandbox.update(...)`) to await
	 * @param form - The form to attach an error to if the query fails
	 * @param path - The form field to attach the error to
	 * @returns `{ form }` on success. If the query fails because the sandbox wasn't found under
	 * the permission-scoped where clause, sets a permission-denied message; otherwise sets the
	 * underlying error message. Either way returns the form via setError instead of throwing.
	 */
	private static async updateSandbox<T, S extends Record<string, unknown>>(
		query: T,
		form: SuperValidated<S>,
		path: FormPathLeavesWithErrors<S>
	) {
		try {
			await query;
		} catch (e: unknown) {
			if (env.DEBUG) console.error(e);

			if (
				e instanceof Prisma.PrismaClientKnownRequestError &&
				e.meta &&
				'cause' in e.meta &&
				e.meta.cause instanceof String &&
				(e.meta.cause as string).includes("No 'Sandbox' record")
			) {
				return setError(
					form,
					path,
					'You are not allowed to edit this sandbox. You are not an owner or editor'
				);
			}

			return setError(form, path, e instanceof Error ? e.message : `${e}`);
		}

		return { form };
	}

	/**
	 * Create a new shareable link for a graph, under a course or a sandbox. The link name is
	 * lowercased before saving, and must be unique within its parent (enforced by the schema).
	 *
	 * @param user - The user performing the action, must have course or sandbox edit rights
	 * on the chosen parent
	 * @param form - Validated form data with parentType, parentId, graphId, and name
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `name`-field error via setError instead of throwing.
	 */
	static async newLink(user: User, form: SuperValidated<Infer<typeof newLinkSchema>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

		// make name lowercase
		form.data.name = form.data.name.toLowerCase();

		if (form.data.parentType === 'COURSE') {
			const query = prisma.course.update({
				where: {
					id: form.data.parentId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					links: {
						create: {
							name: form.data.name,
							graphId: form.data.graphId,
							parentType: form.data.parentType
						}
					}
				}
			});

			return await this.updateCourse(query, form, 'name');
		} else if (form.data.parentType === 'SANDBOX') {
			const query = prisma.sandbox.update({
				where: {
					id: form.data.parentId,
					...whereHasSandboxPermission(user, 'OwnerOREditor')
				},
				data: {
					links: {
						create: {
							name: form.data.name,
							graphId: form.data.graphId,
							parentType: form.data.parentType
						}
					}
				}
			});

			return await this.updateSandbox(query, form, 'name');
		}
	}

	/**
	 * Repoint an existing link at a different graph within the same course or sandbox.
	 *
	 * @param user - The user performing the action, must have course or sandbox edit rights
	 * on the link's parent
	 * @param form - Validated form data with parentType, parentId, linkId, and the new graphId
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `parentId`-field error via setError instead of throwing.
	 */
	static async moveLink(user: User, form: SuperValidated<Infer<typeof editLinkSchema>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

		if (form.data.parentType === 'COURSE') {
			const query = prisma.course.update({
				where: {
					id: form.data.parentId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					links: {
						update: {
							where: { id: form.data.linkId },
							data: {
								graphId: form.data.graphId
							}
						}
					}
				}
			});

			return await this.updateCourse(query, form, 'parentId');
		} else if (form.data.parentType === 'SANDBOX') {
			const query = prisma.sandbox.update({
				where: {
					id: form.data.parentId,
					...whereHasSandboxPermission(user, 'OwnerOREditor')
				},
				data: {
					links: {
						update: {
							where: { id: form.data.linkId },
							data: {
								graphId: form.data.graphId
							}
						}
					}
				}
			});

			return await this.updateSandbox(query, form, 'parentId');
		}
	}

	/**
	 * Delete a link. Anyone still holding the link URL will no longer be able to use it to view
	 * the graph.
	 *
	 * @param user - The user performing the action, must have course or sandbox edit rights
	 * on the link's parent
	 * @param form - Validated form data with parentType, parentId, and linkId
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `parentId`-field error via setError instead of throwing.
	 */
	static async deleteLink(user: User, form: SuperValidated<Infer<typeof editLinkSchema>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

		if (form.data.parentType === 'COURSE') {
			const query = prisma.course.update({
				where: {
					id: form.data.parentId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					links: {
						delete: {
							id: form.data.linkId
						}
					}
				}
			});

			return await this.updateCourse(query, form, 'parentId');
		} else if (form.data.parentType === 'SANDBOX') {
			const query = prisma.sandbox.update({
				where: {
					id: form.data.parentId,
					...whereHasSandboxPermission(user, 'OwnerOREditor')
				},
				data: {
					links: {
						delete: {
							id: form.data.linkId
						}
					}
				}
			});

			return await this.updateSandbox(query, form, 'parentId');
		}
	}
}
