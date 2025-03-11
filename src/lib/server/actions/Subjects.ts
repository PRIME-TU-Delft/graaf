import prisma from '$lib/server/db/prisma';
import { zod } from 'sveltekit-superforms/adapters';
import { setError, superValidate } from 'sveltekit-superforms';
import { deleteSubjectSchema, subjectRelSchema, subjectSchema } from '$lib/zod/subjectSchema';

import type { RequestEvent } from '@sveltejs/kit';

export class SubjectActions {
	/**
	 * Adds a subject to the graph based on the provided event.
	 *
	 * @param event - The request event containing the form data for the subject.
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

	static async addSubjectToGraph(event: RequestEvent) {
		const form = await superValidate(event, zod(subjectSchema));

		if (!form.valid) {
			return setError(form, 'name', 'Invalid subject');
		}

		try {
			const subjectCount = await prisma.subject.count({
				where: {
					graphId: form.data.graphId
				}
			});

			await prisma.subject.create({
				data: {
					name: form.data.name,
					order: subjectCount,
					graphId: form.data.graphId,
					domainId: form.data.domainId > 0 ? form.data.domainId : null
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	static async deleteSubject(event: RequestEvent) {
		const form = await superValidate(event, zod(deleteSubjectSchema));

		if (!form.valid) return setError(form, '', 'Invalid subject');

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

		const deleteSubject = prisma.subject.delete({
			where: { id: form.data.subjectId }
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

	static async changeSubject(event: RequestEvent) {
		const form = await superValidate(event, zod(subjectSchema));

		if (!form.valid) return setError(form, 'name', 'Invalid subject');
		if (form.data.subjectId === 0) {
			return setError(form, 'name', 'Invalid subject id, cannot be 0');
		}

		try {
			await prisma.subject.update({
				where: { id: form.data.subjectId },
				data: {
					name: form.data.name,
					domainId: form.data.domainId > 0 ? form.data.domainId : null
				}
			});
		} catch (e: unknown) {
			return setError(form, 'name', e instanceof Error ? e.message : `${e}`);
		}
	}

	/**
	 * Adds a relationship between two subjects based on the provided event.
	 *
	 * @param event - The request event containing the form data for the subject relationship.
	 * @returns A promise that resolves to an error message if the form is invalid or if the subjects are already connected.
	 * @throws Will throw an error if there is an issue with the database transaction.
	 *
	 * The function performs the following steps:
	 * 1. Validates the form data using `superValidate` and `zod(subjectRelSchema)`.
	 * 2. Checks if the subjects are already connected.
	 * 3. If not connected, updates the subjects to connect them in both directions.
	 * 4. Executes the updates within a database transaction.
	 */

	static async addSubjectRel(event: RequestEvent) {
		const form = await superValidate(event, zod(subjectRelSchema));

		if (!form.valid) {
			return setError(form, '', 'Invalid subject relationship');
		}

		try {
			// Check if the subjects are already connected
			const isConnected = await prisma.subject.findFirst({
				where: {
					id: form.data.sourceSubjectId,
					targetSubjects: {
						some: {
							id: form.data.targetSubjectId
						}
					}
				}
			});

			if (isConnected) {
				return setError(form, '', 'Subjects are already connected');
			}

			const addTargetToSource = prisma.subject.update({
				where: {
					id: form.data.sourceSubjectId
				},
				data: {
					targetSubjects: {
						connect: {
							id: form.data.targetSubjectId
						}
					}
				}
			});

			const addSourceToTarget = prisma.subject.update({
				where: {
					id: form.data.targetSubjectId
				},
				data: {
					sourceSubjects: {
						connect: {
							id: form.data.sourceSubjectId
						}
					}
				}
			});

			await prisma.$transaction([addTargetToSource, addSourceToTarget]);
		} catch (e: unknown) {
			return setError(form, '', e instanceof Error ? e.message : `${e}`);
		}
	}
}
