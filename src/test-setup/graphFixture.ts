import type { PrismaGraphPayload } from '$lib/d3/types';

/**
 * A minimal graph payload shaped like GraphD3.formatPayload expects: one domain, three subjects
 * chained S1 -> S2 -> S3, and one lecture covering S2. That gives the lecture a non-trivial node
 * set (present: S2, past: S1, future: S3, 3 nodes total) without needing real Prisma rows.
 */
export function buildGraphFixture(): PrismaGraphPayload {
	const domain = { id: 1, name: 'Domain 1', style: 'PROSPEROUS_RED', x: 0, y: 0 };
	const subject1 = { id: 1, name: 'Subject 1', domainId: 1, x: 0, y: 0 };
	const subject2 = { id: 2, name: 'Subject 2', domainId: 1, x: 1, y: 0 };
	const subject3 = { id: 3, name: 'Subject 3', domainId: 1, x: 2, y: 0 };

	return {
		id: 1,
		name: 'Test graph',
		domains: [{ ...domain, sourceDomains: [], targetDomains: [] }],
		subjects: [
			{ ...subject1, sourceSubjects: [], targetSubjects: [subject2] },
			{ ...subject2, sourceSubjects: [subject1], targetSubjects: [subject3] },
			{ ...subject3, sourceSubjects: [subject2], targetSubjects: [] }
		],
		lectures: [{ id: 1, name: 'Lecture 1', subjects: [subject2] }]
		// Cast: this only fills the fields GraphD3.formatPayload actually reads, not every
		// column on the underlying Prisma models.
	} as unknown as PrismaGraphPayload;
}
