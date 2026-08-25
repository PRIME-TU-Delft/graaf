import { beforeAll, describe, expect, it } from 'vitest';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 as zod } from 'sveltekit-superforms/adapters';

import prisma from '$lib/server/db/prisma';
import { DomainActions } from '../Domains';
import { GraphActions } from '../Graphs';
import { LectureActions } from '../Lectures';
import { SubjectActions } from '../Subjects';
import { reorderDomainsSchema } from '$lib/zod/domainSchema';
import { nodePositionsSchema } from '$lib/zod/graphSchema';
import { lectureSchema, reorderLectureSubjectsSchema } from '$lib/zod/lectureSchema';
import { reorderSubjectsSchema } from '$lib/zod/subjectSchema';
import { FIXTURE_COURSES, FIXTURE_EMAILS, FIXTURE_GRAPHS } from './helpers/fixture';

import type { User } from '@prisma/client';

/** Whether an action returned a failure rather than `{ form }` (see withPermissionCheck). */
function failed(result: unknown) {
	return typeof result === 'object' && result !== null && 'status' in result;
}

function user(email: string) {
	return prisma.user.findFirstOrThrow({ where: { email } }) as Promise<User>;
}

function graph(name: string, courseCode: string) {
	return prisma.graph.findFirstOrThrow({ where: { name, course: { code: courseCode } } });
}

describe('reordering actions', () => {
	let superAdmin: User;
	let outsider: User;

	beforeAll(async () => {
		superAdmin = await user(FIXTURE_EMAILS.superAdmin);
		// Admin of CourseTwo only, so they have no rights on CourseOne's graph.
		outsider = await user(FIXTURE_EMAILS.courseAdmin);
	});

	it('reorders domains and rejects a user without permission', async () => {
		const graphOne = await graph(FIXTURE_GRAPHS.one, FIXTURE_COURSES.one.code);
		const domains = await prisma.domain.findMany({
			where: { graphId: graphOne.id },
			orderBy: { order: 'asc' }
		});
		const reversed = domains.map((domain) => domain.id).toReversed();

		const denied = await superValidate(
			{ graphId: graphOne.id, domainIds: reversed },
			zod(reorderDomainsSchema)
		);
		expect(failed(await DomainActions.reorderDomains(outsider, denied))).toBe(true);
		expect(
			(
				await prisma.domain.findMany({ where: { graphId: graphOne.id }, orderBy: { order: 'asc' } })
			).map((domain) => domain.id)
		).toEqual(domains.map((domain) => domain.id));

		const allowed = await superValidate(
			{ graphId: graphOne.id, domainIds: reversed },
			zod(reorderDomainsSchema)
		);
		expect(failed(await DomainActions.reorderDomains(superAdmin, allowed))).toBe(false);
		expect(
			(
				await prisma.domain.findMany({ where: { graphId: graphOne.id }, orderBy: { order: 'asc' } })
			).map((domain) => domain.id)
		).toEqual(reversed);
	});

	it('will not reorder a domain that belongs to another graph', async () => {
		const graphOne = await graph(FIXTURE_GRAPHS.one, FIXTURE_COURSES.one.code);
		const graphTwo = await graph(FIXTURE_GRAPHS.two, FIXTURE_COURSES.two.code);
		const foreign = await prisma.domain.findFirstOrThrow({ where: { graphId: graphTwo.id } });
		const before = await prisma.domain.findUniqueOrThrow({ where: { id: foreign.id } });

		const form = await superValidate(
			{ graphId: graphOne.id, domainIds: [foreign.id] },
			zod(reorderDomainsSchema)
		);

		expect(failed(await DomainActions.reorderDomains(superAdmin, form))).toBe(true);
		expect((await prisma.domain.findUniqueOrThrow({ where: { id: foreign.id } })).order).toBe(
			before.order
		);
	});

	it('reorders subjects', async () => {
		const graphThree = await graph(FIXTURE_GRAPHS.three, FIXTURE_COURSES.three.code);
		const subjects = await prisma.subject.findMany({
			where: { graphId: graphThree.id },
			orderBy: { order: 'asc' }
		});
		const reversed = subjects.map((subject) => subject.id).toReversed();

		const form = await superValidate(
			{ graphId: graphThree.id, subjectIds: reversed },
			zod(reorderSubjectsSchema)
		);

		expect(failed(await SubjectActions.reorderSubjects(superAdmin, form))).toBe(false);
		expect(
			(
				await prisma.subject.findMany({
					where: { graphId: graphThree.id },
					orderBy: { order: 'asc' }
				})
			).map((subject) => subject.id)
		).toEqual(reversed);
	});

	it('orders a lecture’s subjects by subjectOrder in the renderable payload', async () => {
		const graphTwo = await graph(FIXTURE_GRAPHS.two, FIXTURE_COURSES.two.code);
		const subjects = await prisma.subject.findMany({
			where: { graphId: graphTwo.id },
			orderBy: { order: 'asc' }
		});
		const lecture = await prisma.lecture.create({
			data: {
				name: 'OrderedLecture',
				order: 0,
				graphId: graphTwo.id,
				subjects: { connect: subjects.map(({ id }) => ({ id })) },
				subjectOrder: subjects.map(({ id }) => id)
			}
		});

		const reversed = subjects.map((subject) => subject.id).toReversed();
		const form = await superValidate(
			{ graphId: graphTwo.id, lectureId: lecture.id, subjectIds: reversed },
			zod(reorderLectureSubjectsSchema)
		);

		expect(failed(await LectureActions.reorderLectureSubjects(superAdmin, form))).toBe(false);

		const payload = await GraphActions.getRenderablePayload({ id: graphTwo.id });
		const rendered = payload?.lectures.find(({ id }) => id === lecture.id);
		expect(rendered?.subjects.map((subject) => subject.id)).toEqual(reversed);
	});

	it('keeps subjectOrder in step when a lecture’s subjects are relinked', async () => {
		const graphThree = await graph(FIXTURE_GRAPHS.three, FIXTURE_COURSES.three.code);
		const subjects = await prisma.subject.findMany({
			where: { graphId: graphThree.id },
			orderBy: { order: 'asc' }
		});
		const [first, second, third] = subjects.map((subject) => subject.id);

		const lecture = await prisma.lecture.create({
			data: {
				name: 'RelinkedLecture',
				order: 0,
				graphId: graphThree.id,
				subjects: { connect: [{ id: third }, { id: first }] },
				subjectOrder: [third, first]
			}
		});

		// Drop `first`, keep `third` where it is, add `second`.
		const form = await superValidate(
			{
				graphId: graphThree.id,
				lectureId: lecture.id,
				name: lecture.name,
				subjectIds: [second, third]
			},
			zod(lectureSchema)
		);

		expect(failed(await LectureActions.linkSubjectsToLecture(superAdmin, form))).toBe(false);
		expect(
			(await prisma.lecture.findUniqueOrThrow({ where: { id: lecture.id } })).subjectOrder
		).toEqual([third, second]);
	});

	it('saves node positions and rejects a node from another graph', async () => {
		const graphOne = await graph(FIXTURE_GRAPHS.one, FIXTURE_COURSES.one.code);
		const graphTwo = await graph(FIXTURE_GRAPHS.two, FIXTURE_COURSES.two.code);
		const domain = await prisma.domain.findFirstOrThrow({ where: { graphId: graphOne.id } });
		const subject = await prisma.subject.findFirstOrThrow({ where: { graphId: graphOne.id } });
		const foreign = await prisma.subject.findFirstOrThrow({ where: { graphId: graphTwo.id } });

		const form = await superValidate(
			{
				graphId: graphOne.id,
				domains: [{ id: domain.id, x: 7, y: -3 }],
				subjects: [{ id: subject.id, x: 4, y: 5 }]
			},
			zod(nodePositionsSchema)
		);

		expect(failed(await GraphActions.updateNodePositions(superAdmin, form))).toBe(false);
		expect(await prisma.domain.findUniqueOrThrow({ where: { id: domain.id } })).toMatchObject({
			x: 7,
			y: -3
		});
		expect(await prisma.subject.findUniqueOrThrow({ where: { id: subject.id } })).toMatchObject({
			x: 4,
			y: 5
		});

		const smuggled = await superValidate(
			{
				graphId: graphOne.id,
				domains: [],
				subjects: [{ id: foreign.id, x: 99, y: 99 }]
			},
			zod(nodePositionsSchema)
		);

		expect(failed(await GraphActions.updateNodePositions(superAdmin, smuggled))).toBe(true);
		expect((await prisma.subject.findUniqueOrThrow({ where: { id: foreign.id } })).x).not.toBe(99);
	});
});
