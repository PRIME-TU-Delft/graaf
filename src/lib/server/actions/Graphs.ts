import { env } from '$env/dynamic/private';
import { setError } from '$lib/utils/setError';
import prisma from '$lib/server/db/prisma';
import { redirect } from '@sveltejs/kit';
import {
	whereHasCoursePermission,
	whereHasGraphCoursePermission,
	whereHasSandboxPermission
} from '../permissions';
import { withPermissionCheck } from './permissionError';
import { GraphValidator } from '$lib/validators/graphValidator';

import type {
	newGraphSchema,
	graphSchemaWithId,
	duplicateGraphSchema,
	nodePositionsSchema
} from '$lib/zod/graphSchema';
import type { PrismaGraphPayload, Issues } from '$lib/validators/types';

import type { Prisma, User } from '@prisma/client';
import type { Infer, SuperValidated } from 'sveltekit-superforms';

/** Server actions for creating, renaming, deleting, and duplicating graphs under a course or
 * sandbox. Called from form actions in `+page.server.ts` route files, one static method per
 * operation. */
export class GraphActions {
	/**
	 * The `include` shape needed to render a graph: domains and subjects with their relation
	 * edges, ordered for display, plus lectures with their subjects. Shared by every loader that
	 * needs a full renderable graph, so a schema change to what "renderable" means only needs
	 * updating here.
	 */
	private static readonly renderablePayloadInclude = {
		domains: {
			include: {
				sourceDomains: true,
				targetDomains: true
			},
			orderBy: { order: 'asc' as const }
		},
		subjects: {
			include: {
				sourceSubjects: true,
				targetSubjects: true,
				domain: true
			},
			orderBy: { order: 'asc' as const }
		},
		lectures: {
			include: {
				subjects: true
			},
			orderBy: { order: 'asc' as const }
		}
	} satisfies Prisma.GraphInclude;

	/**
	 * Fetch a graph with the full shape needed to render and validate it: domains, subjects, and
	 * lectures with their relations, in display order. Used by both the graph-editor loader and
	 * the public graph viewer loader so the query shape is defined once.
	 *
	 * @param where - Prisma where clause identifying the graph (by id, or by course/link for the
	 * public viewer)
	 * @param extraInclude - Additional relations to include alongside the renderable shape, e.g.
	 * the parent course/sandbox for breadcrumbs
	 * @returns The matching graph, or `null` if none matches
	 */
	static async getRenderablePayload<Extra extends Prisma.GraphInclude = object>(
		where: Prisma.GraphWhereInput,
		extraInclude?: Extra
	): Promise<Prisma.GraphGetPayload<{
		include: typeof GraphActions.renderablePayloadInclude & Extra;
	}> | null> {
		const graph = (await prisma.graph.findFirst({
			where,
			include: { ...this.renderablePayloadInclude, ...extraInclude }
		})) as Prisma.GraphGetPayload<{
			include: typeof GraphActions.renderablePayloadInclude;
		}> | null;

		if (!graph) return null;

		// Lecture.subjects has no sortable column of its own (it's a plain many-to-many relation),
		// so display order within a lecture lives on Lecture.subjectOrder as a list of subject
		// ids, applied here after the fetch. Subjects missing from that list sort to the end and
		// keep the relative order the query returned them in.
		for (const lecture of graph.lectures) {
			if (lecture.subjectOrder.length === 0) continue;

			const rank = new Map(lecture.subjectOrder.map((id, index) => [id, index]));
			lecture.subjects.sort(
				(a, b) =>
					(rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
			);
		}

		return graph as Prisma.GraphGetPayload<{
			include: typeof GraphActions.renderablePayloadInclude & Extra;
		}>;
	}

	/**
	 * Persist the canvas positions of a graph's domain and subject nodes. Written as one nested
	 * write scoped to the graph, so a single permission check covers every node and a node id
	 * from another graph can't be smuggled in.
	 *
	 * @param user - The user performing the action, must have course or program admin/editor rights
	 * @param form - Validated form data with the graphId and the new x/y of each moved domain and
	 * subject
	 * @returns Nothing on success. On invalid input, an id that isn't in this graph, or missing
	 * permission, returns the form with an error via setError instead of throwing.
	 */
	static async updateNodePositions(
		user: User,
		form: SuperValidated<Infer<typeof nodePositionsSchema>>
	) {
		if (!form.valid) return setError(form, '', 'Invalid node positions');

		return await withPermissionCheck(
			() =>
				prisma.graph.update({
					where: {
						id: form.data.graphId,
						...whereHasGraphCoursePermission(user, 'CourseAdminEditorORProgramAdminEditor')
					},
					data: {
						domains: {
							update: form.data.domains.map(({ id, x, y }) => ({
								where: { id },
								data: { x, y }
							}))
						},
						subjects: {
							update: form.data.subjects.map(({ id, x, y }) => ({
								where: { id },
								data: { x, y }
							}))
						}
					}
				}),
			form,
			'',
			{ entity: 'Graph', message: "You don't have permission to move nodes in this graph" }
		);
	}

	/**
	 * Run domain/subject/lecture validation on a renderable graph payload.
	 *
	 * @param graph - A graph fetched via getRenderablePayload (or any structurally compatible payload)
	 * @returns The list of validation issues, indexable by domain/subject/lecture id
	 */
	static validate(graph: PrismaGraphPayload): Issues {
		return new GraphValidator(graph).validate();
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
					graphs: {
						create: {
							parentType: form.data.parentType,
							name: form.data.name
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
					graphs: {
						update: {
							where: { id: form.data.graphId },
							data: { name: form.data.name }
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
					graphs: {
						delete: { id: form.data.graphId }
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
