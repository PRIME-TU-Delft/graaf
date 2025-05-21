import { env } from '$env/dynamic/private';
import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { whereHasCoursePermission, whereHasSandboxPermission } from '../permissions';

import type { editLinkSchema, newLinkSchema } from '$lib/zod/linkSchema';

import type { User } from '@prisma/client';
import type { FormPathLeavesWithErrors, Infer, SuperValidated } from 'sveltekit-superforms';

export class LinkActions {
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
				e instanceof PrismaClientKnownRequestError &&
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
				e instanceof PrismaClientKnownRequestError &&
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

	static async newLink(user: User, form: SuperValidated<Infer<typeof newLinkSchema>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

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
