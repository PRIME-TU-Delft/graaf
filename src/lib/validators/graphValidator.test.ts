// GraphValidator.test.ts
import { describe, expect, test } from 'vitest';
import { GraphValidator } from './graphValidator';

import type { Domain, Subject } from '@prisma/client';
import type { PrismaGraphPayload, PrismaDomainPayload } from './types';
import type { PrismaSubjectPayload } from '$lib/d3/types';

function dummyDomain(id: number, name: string) {
	return {
		name,
		id,
		style: null,
		x: 0,
		y: 0,
		order: 0,
		sourceDomains: [] as Domain[],
		targetDomains: [] as Domain[],
		graphId: 0
	} as PrismaDomainPayload;
}

function dummySubject(id: number, name: string, domain: number) {
	return {
		name,
		id,
		x: 0,
		y: 0,
		sourceSubjects: [] as Subject[],
		targetSubjects: [] as Subject[],
		graphId: 0,
		domainId: domain
	} as PrismaSubjectPayload;
}

function dummyGraph(domains: PrismaDomainPayload[], subjects: PrismaSubjectPayload[]) {
	return {
		name: 'graph',
		id: 0,
		courseId: 'CSE2000',
		createdAt: new Date(),
		updatedAt: new Date(),
		domains: domains,
		subjects: subjects
	} as PrismaGraphPayload;
}

function addDomainConnection(from: PrismaDomainPayload, to: PrismaDomainPayload) {
	from.targetDomains.push(to);
	to.sourceDomains.push(from);
}

function addSubjectConnection(from: PrismaSubjectPayload, to: PrismaSubjectPayload) {
	from.targetSubjects.push(to);
	to.sourceSubjects.push(from);
}

describe('GraphValidator', () => {
	test('should handle trivial graphs', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);

		const subjectA = dummySubject(1, 'Subject A', 1);
		const subjectB = dummySubject(2, 'Subject B', 2);
		const subjectC = dummySubject(3, 'Subject C', 3);

		addSubjectConnection(subjectA, subjectB);
		addSubjectConnection(subjectB, subjectC);

		const graph = dummyGraph([domainC, domainB, domainA], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(0);
		expect(subjectCycles).toHaveLength(0);
		expect(conflictingEdges).toHaveLength(0);
	});

	test('should handle empty graphs', () => {
		const graph = dummyGraph([], []);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(0);
		expect(subjectCycles).toHaveLength(0);
		expect(conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with multiple roots (no cycles/conflicts)', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');

		addDomainConnection(domainA, domainC);
		addDomainConnection(domainB, domainC);

		const subjectA = dummySubject(1, 'Subject A', 1);
		const subjectB = dummySubject(2, 'Subject B', 2);
		const subjectC = dummySubject(3, 'Subject C', 3);

		addSubjectConnection(subjectA, subjectC);
		addSubjectConnection(subjectB, subjectC);

		const graph = dummyGraph([domainA, domainB, domainC], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(0);
		expect(subjectCycles).toHaveLength(0);
		expect(conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with cycles (single cycle)', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainC, domainA); // Introduces cycle

		const subjectA = dummySubject(1, 'Subject A', 1);
		const subjectB = dummySubject(2, 'Subject B', 2);

		addSubjectConnection(subjectA, subjectB);
		addSubjectConnection(subjectB, subjectA); // Introduces cycle

		const graph = dummyGraph([domainA, domainB, domainC], [subjectA, subjectB]);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(1);
		expect(domainCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 1 }
				])
			])
		);

		expect(subjectCycles).toHaveLength(1);
		expect(subjectCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 1 }
				])
			])
		);

		expect(conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with multiple cycles', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');
		const domainD = dummyDomain(4, 'D');

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainC, domainA); // Introduces 2 cycles
		addDomainConnection(domainB, domainD);
		addDomainConnection(domainD, domainC);

		const subjectA = dummySubject(1, 'Subject A', 1);
		const subjectB = dummySubject(2, 'Subject B', 2);
		const subjectC = dummySubject(3, 'Subject C', 3);

		addSubjectConnection(subjectA, subjectB); // Introduces cycle
		addSubjectConnection(subjectB, subjectA);
		addSubjectConnection(subjectB, subjectC);
		addSubjectConnection(subjectC, subjectA);

		const graph = dummyGraph([domainA, domainB, domainC, domainD], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(2);
		expect(domainCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 1 }
				]),
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 4 },
					{ source: 4, target: 3 },
					{ source: 3, target: 1 }
				])
			])
		);

		expect(subjectCycles).toHaveLength(2);
		expect(subjectCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 1 }
				]),
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 1 }
				])
			])
		);

		expect(conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with conflicting edges (single conflict)', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);

		const subjectA = dummySubject(1, 'Subject A', 1);
		const subjectB = dummySubject(2, 'Subject B', 2);
		const subjectC = dummySubject(3, 'Subject C', 3);

		addSubjectConnection(subjectA, subjectC);
		addSubjectConnection(subjectC, subjectB);

		const graph = dummyGraph([domainA, domainB, domainC], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(0);
		expect(subjectCycles).toHaveLength(0);
		expect(conflictingEdges).toHaveLength(1); // One conflicting edge found
		expect(conflictingEdges).toContainEqual({ source: 3, target: 2 });
	});

	test('should handle graphs with multiple conflicting edges', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');
		const domainD = dummyDomain(4, 'D');

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainB, domainD);

		const subjectA = dummySubject(1, 'Subject A', 1);
		const subjectB = dummySubject(2, 'Subject B', 2);
		const subjectC = dummySubject(3, 'Subject C', 3);
		const subjectD = dummySubject(4, 'Subject D', 4);

		addSubjectConnection(subjectD, subjectA); // Conflicting edge
		addSubjectConnection(subjectA, subjectC);
		addSubjectConnection(subjectC, subjectB); // Conflicting edge

		const graph = dummyGraph(
			[domainA, domainB, domainC, domainD],
			[subjectA, subjectB, subjectC, subjectD]
		);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(0);
		expect(subjectCycles).toHaveLength(0);
		expect(conflictingEdges).toHaveLength(2); // Two conflicting edges found
		expect(conflictingEdges).toContainEqual({ source: 4, target: 1 });
		expect(conflictingEdges).toContainEqual({ source: 3, target: 2 });
	});

	test('should handle graphs with multiple roots, cycles, and conflicting edges', () => {
		const domainA = dummyDomain(1, 'A');
		const domainB = dummyDomain(2, 'B');
		const domainC = dummyDomain(3, 'C');
		const domainD = dummyDomain(4, 'D');
		const domainE = dummyDomain(5, 'E');

		addDomainConnection(domainA, domainC);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainC, domainA); // Cycle
		addDomainConnection(domainC, domainD);
		addDomainConnection(domainD, domainE);
		addDomainConnection(domainE, domainD); // Cycle

		const subjectA = dummySubject(1, 'Subject A', 3);
		const subjectB = dummySubject(2, 'Subject B', 2);
		const subjectC = dummySubject(3, 'Subject C', 4);

		addSubjectConnection(subjectA, subjectB); // Conflicting edge
		addSubjectConnection(subjectB, subjectC);
		addSubjectConnection(subjectC, subjectA); // Cycle

		const graph = dummyGraph(
			[domainA, domainB, domainC, domainD, domainE],
			[subjectA, subjectB, subjectC]
		);
		const validator = new GraphValidator(graph);
		const domainCycles = validator.findCycles(validator.domains);
		const subjectCycles = validator.findCycles(validator.subjects);
		const conflictingEdges = validator.findConflictingEdges(
			validator.domains,
			validator.subjects,
			validator.inheritanceMap
		);

		expect(domainCycles).toHaveLength(2);
		expect(domainCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 4, target: 5 },
					{ source: 5, target: 4 }
				]),
				expect.arrayContaining([
					{ source: 1, target: 3 },
					{ source: 3, target: 1 }
				])
			])
		);

		expect(subjectCycles).toHaveLength(1);
		expect(subjectCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 1 }
				])
			])
		);

		expect(conflictingEdges).toHaveLength(2);
		expect(conflictingEdges).toEqual(
			expect.arrayContaining([
				{ source: 1, target: 2 },
				{ source: 3, target: 1 }
			])
		);
	});
});
