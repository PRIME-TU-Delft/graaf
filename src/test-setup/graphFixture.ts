import type { Domain, Lecture, Subject } from '@prisma/client';
import type { RenderableGraph } from '$lib/graph/renderablePayload';

/**
 * A minimal graph payload shaped like the loaders return it: one domain, three subjects chained
 * S1 -> S2 -> S3, and one lecture covering S2. That gives the lecture a non-trivial node set
 * (present: S2, past: S1, future: S3, 3 nodes total) without needing a database.
 *
 * Every field the graph store reads in hydration.ts is filled in, so this is a real
 * RenderableGraph rather than a cast, and a schema change shows up here as a type error.
 */
export function buildGraphFixture(): RenderableGraph {
	const createdAt = new Date('2026-01-01T00:00:00.000Z');
	const updatedAt = createdAt;

	const domain: Domain = {
		id: 1,
		name: 'Domain 1',
		style: 'PROSPEROUS_RED',
		order: 0,
		x: 0,
		y: 0,
		graphId: 1,
		createdAt,
		updatedAt
	};

	const subject = (id: number, x: number): Subject => ({
		id,
		name: `Subject ${id}`,
		order: id - 1,
		x,
		y: 0,
		graphId: 1,
		domainId: domain.id,
		createdAt,
		updatedAt
	});

	const subject1 = subject(1, 0);
	const subject2 = subject(2, 1);
	const subject3 = subject(3, 2);

	const lecture: Lecture = {
		id: 1,
		name: 'Lecture 1',
		order: 0,
		subjectOrder: [subject2.id],
		graphId: 1,
		createdAt,
		updatedAt
	};

	return {
		id: 1,
		name: 'Test graph',
		parentType: 'SANDBOX',
		courseId: null,
		sandboxId: 1,
		createdAt,
		updatedAt,
		domains: [{ ...domain, sourceDomains: [], targetDomains: [] }],
		subjects: [
			{ ...subject1, domain, sourceSubjects: [], targetSubjects: [subject2] },
			{ ...subject2, domain, sourceSubjects: [subject1], targetSubjects: [subject3] },
			{ ...subject3, domain, sourceSubjects: [subject2], targetSubjects: [] }
		],
		lectures: [{ ...lecture, subjects: [subject2] }]
	};
}
