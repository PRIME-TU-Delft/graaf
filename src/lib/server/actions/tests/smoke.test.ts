import { describe, expect, it } from 'vitest';
import prisma from '$lib/server/db/prisma';
import { FIXTURE_COURSES, FIXTURE_GRAPHS, FIXTURE_PROGRAMS } from './helpers/fixture';

describe('integration test harness', () => {
	it('loads the seeded fixture', async () => {
		const programs = await prisma.program.findMany({ include: { courses: true } });
		expect(programs.map((p) => p.name).sort()).toEqual(
			[FIXTURE_PROGRAMS.one, FIXTURE_PROGRAMS.two, FIXTURE_PROGRAMS.three].sort()
		);
		for (const program of programs) {
			expect(program.courses).toHaveLength(3);
		}

		const graphOne = await prisma.graph.findFirstOrThrow({
			where: { name: FIXTURE_GRAPHS.one, course: { code: FIXTURE_COURSES.one.code } },
			include: { domains: { include: { targetDomains: true } }, subjects: true }
		});
		expect(graphOne.domains).toHaveLength(3);
		expect(graphOne.subjects).toHaveLength(3);

		const domainOne = graphOne.domains.find((d) => d.name === 'DomainOne');
		expect(domainOne?.targetDomains.map((d) => d.name)).toEqual(['DomainTwo']);
	});
});
