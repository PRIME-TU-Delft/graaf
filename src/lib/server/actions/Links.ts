import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { whereHasCoursePermission, whereHasSandboxPermission } from '../permissions';
import { withPermissionCheck } from './permissionError';

import type { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';

import type { User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

/** Server actions for creating, moving, and deleting shareable graph links under a course or
 * sandbox. Called from form actions in `+page.server.ts` route files, one static method per
 * operation. */
export class LinkActions {
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

			return await withPermissionCheck(() => query, form, 'name', {
				entity: 'Course',
				message:
					'You are not allowed to edit this course. You are not an program admin/editor or course admin/editor'
			});
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

			return await withPermissionCheck(() => query, form, 'name', {
				entity: 'Sandbox',
				message: 'You are not allowed to edit this sandbox. You are not an owner or editor'
			});
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

			return await withPermissionCheck(() => query, form, 'parentId', {
				entity: 'Course',
				message:
					'You are not allowed to edit this course. You are not an program admin/editor or course admin/editor'
			});
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

			return await withPermissionCheck(() => query, form, 'parentId', {
				entity: 'Sandbox',
				message: 'You are not allowed to edit this sandbox. You are not an owner or editor'
			});
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

			return await withPermissionCheck(() => query, form, 'parentId', {
				entity: 'Course',
				message:
					'You are not allowed to edit this course. You are not an program admin/editor or course admin/editor'
			});
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

			return await withPermissionCheck(() => query, form, 'parentId', {
				entity: 'Sandbox',
				message: 'You are not allowed to edit this sandbox. You are not an owner or editor'
			});
		}
	}
}
