import { env } from '$env/dynamic/private';
import prisma from '$lib/server/db/prisma';
import { setError } from '$lib/utils/setError';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { redirect } from '@sveltejs/kit';
import { whereHasCoursePermission, whereHasSandboxPermission } from '../permissions';

import type { User } from '@prisma/client';
import type { FormPathLeavesWithErrors, Infer, SuperValidated } from 'sveltekit-superforms';
import type { duplicateGraphSchema, newGraphSchema, graphSchemaWithId } from '$lib/zod/graphSchema';

export class GraphActions {
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

	static async newGraph(user: User, form: SuperValidated<Infer<typeof newGraphSchema>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid form');

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

	static async editGraph(user: User, form: SuperValidated<Infer<typeof graphSchemaWithId>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid form');

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

	static async deleteGraph(user: User, form: SuperValidated<Infer<typeof graphSchemaWithId>>) {
		if (!form.valid) return setError(form, 'name', 'Invalid form');

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
		if (form.data.sourceId !== form.data.destinationId) {
			redirect(303, destinationUrl);
		}

		return { form };
	}
}
