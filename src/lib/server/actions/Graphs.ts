import { env } from '$env/dynamic/private';
import { setError } from '$lib/utils/setError';
import prisma from '$lib/server/db/prisma';
import { redirect } from '@sveltejs/kit';
import { Prisma } from '@prisma/client';
import { whereHasCoursePermission, whereHasSandboxPermission } from '../permissions';

import type { newGraphSchema, graphSchemaWithId, duplicateGraphSchema } from '$lib/zod/graphSchema';

import type { User } from '@prisma/client';
import type { FormPathLeavesWithErrors, Infer, SuperValidated } from 'sveltekit-superforms';

/** Server actions for creating, renaming, deleting, and duplicating graphs under a course or
 * sandbox. Called from form actions in `+page.server.ts` route files, one static method per
 * operation. */
export class GraphActions {
	/**
	 * Await a course-scoped Prisma write and translate a permission failure into a form error.
	 * Shared by every action in this class that mutates a graph through its parent course.
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
	 * Create a new empty graph under a course or a sandbox.
	 *
	 * @param user - The user performing the action, must have course or sandbox edit rights
	 * on the chosen parent
	 * @param form - Validated form data with parentType ('COURSE' | 'SANDBOX'), parentId, and name
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `name`-field error via setError instead of throwing.
	 */
	static async newGraph(user: User, form: SuperValidated<Infer<typeof newGraphSchema>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

		if (form.data.parentType === 'COURSE') {
			const query = prisma.course.update({
				where: {
					id: form.data.parentId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					graphs: {
						create: {
							parentType: form.data.parentType,
							name: form.data.name
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
					graphs: {
						create: {
							parentType: form.data.parentType,
							name: form.data.name
						}
					}
				}
			});

			return await this.updateSandbox(query, form, 'name');
		}
	}

	/**
	 * Rename a graph belonging to a course or a sandbox.
	 *
	 * @param user - The user performing the action, must have course or sandbox edit rights
	 * on the graph's parent
	 * @param form - Validated form data with parentType, parentId, graphId, and the new name
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `name`-field error via setError instead of throwing.
	 */
	static async editGraph(user: User, form: SuperValidated<Infer<typeof graphSchemaWithId>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

		if (form.data.parentType === 'COURSE') {
			const query = prisma.course.update({
				where: {
					id: form.data.parentId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					graphs: {
						update: {
							where: { id: form.data.graphId },
							data: { name: form.data.name }
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
					graphs: {
						update: {
							where: { id: form.data.graphId },
							data: { name: form.data.name }
						}
					}
				}
			});

			return await this.updateSandbox(query, form, 'name');
		}
	}

	/**
	 * Delete a graph belonging to a course or a sandbox.
	 *
	 * @param user - The user performing the action, must have course or sandbox edit rights
	 * on the graph's parent
	 * @param form - Validated form data with parentType, parentId, and graphId
	 * @returns `{ form }` on success. On invalid input or missing permission, returns the form
	 * with a `name`-field error via setError instead of throwing.
	 */
	static async deleteGraph(user: User, form: SuperValidated<Infer<typeof graphSchemaWithId>>) {
		if (!form.valid) return setError(form, '', form.errors._errors?.[0] ?? 'Invalid form');

		if (form.data.parentType === 'COURSE') {
			const query = prisma.course.update({
				where: {
					id: form.data.parentId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				},
				data: {
					graphs: {
						delete: { id: form.data.graphId }
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
					graphs: {
						delete: { id: form.data.graphId }
					}
				}
			});

			return await this.updateSandbox(query, form, 'name');
		}
	}

	/**
	 * Deep-copy a graph (its domains, subjects, lectures, and all relations between them) into a
	 * new graph under a chosen course or sandbox destination.
	 *
	 * Works in two passes because the copied domains/subjects/lectures need new ids before their
	 * relations can be recreated: first every node is bulk-created and an old-id -> new-id map is
	 * built for each entity type, then every relation is recreated in a single transaction using
	 * those maps. If that relation transaction fails, the newly created graph and its nodes are
	 * not rolled back, only the relations are incomplete.
	 *
	 * @param user - The user performing the action, must have edit rights on both the source
	 * graph's parent (implicitly, via the graph lookup) and the chosen destination
	 * @param form - Validated form data with graphId (source), destinationType, destinationId,
	 * and newName
	 * @returns `{ form }` on success when the destination is the same course/sandbox as the
	 * source. When the destination differs, throws a redirect to the destination's page instead
	 * of returning. On invalid input, a missing/inaccessible source or destination, or a failed
	 * relation transaction, returns the form with an error via setError.
	 */
	static async duplicateGraph(
		user: User,
		form: SuperValidated<Infer<typeof duplicateGraphSchema>>
	) {
		if (!form.valid) return setError(form, 'newName', 'Invalid form');

		let destinationUrl: string = '';
		if (form.data.destinationType === 'COURSE') {
			const destination = await prisma.course.findFirst({
				where: {
					id: form.data.destinationId,
					...whereHasCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
				}
			});

			if (!destination)
				return setError(form, '', 'Destination course not found or you do not have access to it');
			destinationUrl = `/graph-editor/courses/${destination.code}`;
		} else if (form.data.destinationType === 'SANDBOX') {
			const destination = await prisma.sandbox.findFirst({
				where: {
					id: form.data.destinationId,
					...whereHasSandboxPermission(user, 'OwnerOREditor')
				}
			});

			if (!destination)
				return setError(form, '', 'Destination sandbox not found or you do not have access to it');
			destinationUrl = `/graph-editor/sandboxes/${destination.id}`;
		}

		const sourcegraph = await prisma.graph.findFirst({
			where: { id: form.data.graphId },
			include: {
				domains: {
					include: {
						sourceDomains: { select: { id: true } },
						targetDomains: { select: { id: true } }
					}
				},
				subjects: {
					include: {
						sourceSubjects: { select: { id: true } },
						targetSubjects: { select: { id: true } },
						domain: { select: { id: true } }
					}
				},
				lectures: {
					include: {
						subjects: { select: { id: true } }
					}
				}
			}
		});

		if (!sourcegraph) {
			return setError(form, '', 'Source graph not found');
		}

		const parentId =
			form.data.destinationType === 'COURSE'
				? { courseId: form.data.destinationId }
				: { sandboxId: form.data.destinationId };

		const newGraph = await prisma.graph.create({
			data: {
				parentType: form.data.destinationType,
				...parentId,
				name: form.data.newName,
				domains: {
					createMany: {
						data: sourcegraph.domains.map((domain) => ({
							name: domain.name,
							order: domain.order,
							style: domain.style
						}))
					}
				},
				subjects: {
					createMany: {
						data: sourcegraph.subjects.map((subject) => ({
							name: subject.name,
							order: subject.order
						}))
					}
				},
				lectures: {
					createMany: {
						data: sourcegraph.lectures.map((lecture) => ({
							name: lecture.name,
							order: lecture.order
						}))
					}
				}
			},
			include: {
				domains: true,
				subjects: true,
				lectures: true
			}
		});

		// Create mapping from old to new domain
		const domainMapping = new Map<number, number>();
		for (let i = 0; i < sourcegraph.domains.length; i++) {
			domainMapping.set(sourcegraph.domains[i].id, newGraph.domains[i].id);
		}

		// Create mapping from old to new subject
		const subjectMapping = new Map<number, number>();
		for (let i = 0; i < sourcegraph.subjects.length; i++) {
			subjectMapping.set(sourcegraph.subjects[i].id, newGraph.subjects[i].id);
		}

		// Create mapping from old to new lecture
		const lectureMapping = new Map<number, number>();
		for (let i = 0; i < sourcegraph.lectures.length; i++) {
			lectureMapping.set(sourcegraph.lectures[i].id, newGraph.lectures[i].id);
		}

		// Create new relations
		const domainRelations = sourcegraph.domains.flatMap((domain) => {
			const newDomainId = domainMapping.get(domain.id);
			if (!newDomainId) return [];

			return prisma.domain.update({
				where: { id: newDomainId },
				data: {
					sourceDomains: {
						connect: domain.sourceDomains.map((sourceDomain) => ({
							id: domainMapping.get(sourceDomain.id)
						}))
					},
					targetDomains: {
						connect: domain.targetDomains.map((targetDomain) => ({
							id: domainMapping.get(targetDomain.id)
						}))
					}
				}
			});
		});

		const subjectRelations = sourcegraph.subjects.flatMap((subject) => {
			const newSubjectId = subjectMapping.get(subject.id);
			if (!newSubjectId) return [];

			return prisma.subject.update({
				where: { id: newSubjectId },
				data: {
					sourceSubjects: {
						connect: subject.sourceSubjects.map((sourceSubject) => ({
							id: subjectMapping.get(sourceSubject.id)
						}))
					},
					targetSubjects: {
						connect: subject.targetSubjects.map((targetSubject) => ({
							id: subjectMapping.get(targetSubject.id)
						}))
					},
					domain: subject.domain
						? { connect: { id: domainMapping.get(subject.domain.id) } }
						: undefined
				}
			});
		});

		const lectureRelations = sourcegraph.lectures.flatMap((lecture) => {
			const newLectureId = lectureMapping.get(lecture.id);
			if (!newLectureId) return [];

			return prisma.lecture.update({
				where: { id: newLectureId },
				data: {
					subjects: {
						connect: lecture.subjects.map((subject) => ({
							id: subjectMapping.get(subject.id)
						}))
					}
				}
			});
		});

		try {
			await prisma.$transaction([...domainRelations, ...subjectRelations, ...lectureRelations]);
		} catch (e) {
			if (env.DEBUG) console.error(e);
			return setError(form, '', 'Failed to duplicate relations');
		}

		// Redirect to the destination course
		if (
			sourcegraph.parentType !== form.data.destinationType ||
			(sourcegraph.parentType === 'COURSE' && sourcegraph.courseId !== form.data.destinationId) ||
			(sourcegraph.parentType === 'SANDBOX' && sourcegraph.sandboxId !== form.data.destinationId)
		) {
			redirect(303, destinationUrl);
		}

		return { form };
	}
}
