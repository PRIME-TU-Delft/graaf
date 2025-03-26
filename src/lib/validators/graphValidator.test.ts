// GraphValidator.test.ts
import { describe, expect, test } from 'vitest';
import { GraphValidator } from './GraphValidator';

import type { Domain, Subject } from '@prisma/client';
import type { PrismaGraphPayload, PrismaDomainPayload } from './types';
import type { PrismaSubjectPayload } from '$lib/d3/types';

function dummyDomain(name: string, id: number) {
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

function dummySubject(name: string, domain: number, id: number) {
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
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);

		const subjectA = dummySubject('Subject A', 1, 1);
		const subjectB = dummySubject('Subject B', 2, 2);
		const subjectC = dummySubject('Subject C', 3, 3);

		addSubjectConnection(subjectA, subjectB);
		addSubjectConnection(subjectB, subjectC);

		const graph = dummyGraph([domainC, domainB, domainA], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainCycles).toHaveLength(0);
		expect(issues.subjectCycles).toHaveLength(0);
		expect(issues.conflictingEdges).toHaveLength(0);
	});

	test('should handle empty graphs', () => {
		const graph = dummyGraph([], []);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainCycles).toHaveLength(0);
		expect(issues.subjectCycles).toHaveLength(0);
		expect(issues.conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with multiple roots (no cycles)', () => {
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);

		addDomainConnection(domainA, domainC);
		addDomainConnection(domainB, domainC);

		const subjectA = dummySubject('Subject A', 1, 1);
		const subjectB = dummySubject('Subject B', 2, 2);
		const subjectC = dummySubject('Subject C', 3, 3);

		addSubjectConnection(subjectA, subjectB);
		addSubjectConnection(subjectA, subjectC);

		const graph = dummyGraph([domainA, domainB, domainC], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainCycles).toHaveLength(0);
		expect(issues.subjectCycles).toHaveLength(0);
		expect(issues.conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with cycles (single cycle)', () => {
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainC, domainA); // Introduces cycle

		const subjectA = dummySubject('Subject A', 1, 1);
		const subjectB = dummySubject('Subject B', 2, 2);

		addSubjectConnection(subjectA, subjectB);
		addSubjectConnection(subjectB, subjectA); // Introduces cycle

		const graph = dummyGraph([domainA, domainB, domainC], [subjectA, subjectB]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainCycles).toHaveLength(1);
		expect(issues.domainCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 1 },
				])
			])
		)

		expect(issues.subjectCycles).toHaveLength(1);
		expect(issues.subjectCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 1 },
				])
			])
		)

		expect(issues.conflictingEdges).toHaveLength(0);
	});

	test('should handle graphs with multiple cycles', () => {
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);
		const domainD = dummyDomain('D', 4);

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainC, domainA); // Introduces 2 cycles
		addDomainConnection(domainB, domainD);
		addDomainConnection(domainD, domainC);

		const subjectA = dummySubject('Subject A', 1, 1);
		const subjectB = dummySubject('Subject B', 2, 2);
		const subjectC = dummySubject('Subject C', 3, 3);

		addSubjectConnection(subjectA, subjectB); // Introduces cycle
		addSubjectConnection(subjectB, subjectA);
		addSubjectConnection(subjectB, subjectC);
		addSubjectConnection(subjectC, subjectA);

		const graph = dummyGraph([domainA, domainB, domainC, domainD], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainCycles).toHaveLength(2);
		expect(issues.domainCycles).toEqual(
			expect.arrayContaining([
    			expect.arrayContaining([
    				{ source: 1, target: 2 },
    				{ source: 2, target: 3 },
    				{ source: 3, target: 1 },
    			]),
    			expect.arrayContaining([
    				{ source: 1, target: 2 },
    				{ source: 2, target: 4 },
    				{ source: 4, target: 3 },
    				{ source: 3, target: 1 },
				]),
			])
		)

		expect(issues.subjectCycles).toHaveLength(2);
		expect(issues.subjectCycles).toEqual(
			expect.arrayContaining([
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 1 },
				]),
				expect.arrayContaining([
					{ source: 1, target: 2 },
					{ source: 2, target: 3 },
					{ source: 3, target: 1 },
				]),
			])
		)

		expect(issues.conflictingEdges).toHaveLength(0);
	});
});

/*
	test('should handle graphs with conflicting edges (single conflict)', () => {
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);

		const subjectA = dummySubject('Subject A', 1, 1);
		const subjectB = dummySubject('Subject B', 2, 3);
		const subjectC = dummySubject('Subject C', 3, 2);

		addSubjectConnection(subjectA, subjectB);
		addSubjectConnection(subjectB, subjectC);

		const graph = dummyGraph([domainA, domainB], [subjectA, subjectB]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainBackEdges).toHaveLength(0);
		expect(issues.subjectBackEdges).toHaveLength(0);
		expect(issues.conflictingEdges).toHaveLength(1); // Conflicting edge found
		expect(issues.conflictingEdges).toContainEqual({ source: 2, target: 3 });
	});

	test('should handle graphs with multiple conflicting edges', () => {
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);
		const domainD = dummyDomain('D', 4);

		addDomainConnection(domainA, domainB);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainB, domainD);

		const subjectA = dummySubject('Subject A', 1, 1);
		const subjectB = dummySubject('Subject B', 2, 2);
		const subjectC = dummySubject('Subject C', 3, 3);
		const subjectD = dummySubject('Subject D', 4, 4);

		addSubjectConnection(subjectD, subjectA); // Conflicting edge
		addSubjectConnection(subjectA, subjectC);
		addSubjectConnection(subjectC, subjectB); // Conflicting edge

		const graph = dummyGraph([domainA, domainB], [subjectA, subjectB]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainBackEdges).toHaveLength(0);
		expect(issues.subjectBackEdges).toHaveLength(0);
		expect(issues.conflictingEdges).toHaveLength(2); // Two conflicting edges found
		expect(issues.conflictingEdges).toContainEqual({ source: 4, target: 1 });
		expect(issues.conflictingEdges).toContainEqual({ source: 3, target: 2 });
	});

	test('should handle graphs with multiple roots, cycles, and conflicting edges', () => {
		const domainA = dummyDomain('A', 1);
		const domainB = dummyDomain('B', 2);
		const domainC = dummyDomain('C', 3);
		const domainD = dummyDomain('D', 4);
		const domainE = dummyDomain('E', 5);

		addDomainConnection(domainA, domainC);
		addDomainConnection(domainB, domainC);
		addDomainConnection(domainC, domainA); // Cycle
		addDomainConnection(domainC, domainD);
		addDomainConnection(domainD, domainE);
		addDomainConnection(domainE, domainD); // Cycle

		const subjectA = dummySubject('Subject A', 1, 3);
		const subjectB = dummySubject('Subject B', 2, 2);
		const subjectC = dummySubject('Subject C', 3, 4);

		addSubjectConnection(subjectA, subjectB); // Conflicting edge
		addSubjectConnection(subjectB, subjectC);
		addSubjectConnection(subjectC, subjectA); // Cycle

		const graph = dummyGraph([domainA, domainB, domainC, domainD, domainE], [subjectA, subjectB, subjectC]);
		const validator = new GraphValidator(graph);
		const issues = validator.validate();

		expect(issues.domainBackEdges).toHaveLength(2); // Two cycles
		expect(issues.domainBackEdges).toContainEqual({ source: 3, target: 1 });
		expect(issues.domainBackEdges).toContainEqual({ source: 5, target: 4 });
		expect(issues.subjectBackEdges).toHaveLength(1); // One cycle
		expect(issues.subjectBackEdges).toContainEqual({ source: 3, target: 1 });
		expect(issues.conflictingEdges).toHaveLength(1); // Conflicting edge
		expect(issues.conflictingEdges).toContainEqual({ source: 1, target: 2 });
	});
});
*/
