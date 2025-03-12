
import { GraphD3 } from './GraphD3';
import { beforeEach, describe, expect, it, test } from 'vitest';

import type { PrismaGraphPayload, PrismaDomainPayload, PrismaSubjectPayload, PrismaLecturePayload } from './types';
import type { Domain, Subject } from '@prisma/client';

function dummyDomain(id: number, name: string, style: string | null = null) {
	return {
		id,
		name,
        x: 0,
        y: 0,
		style: style,
		sourceDomains: [] as Domain[],
		targetDomains: [] as Domain[]
	} as PrismaDomainPayload;
}

function dummySubject(id: number, name: string, domain: number | null = null) {
    return {
        id,
        name,
        x: 0,
        y: 0,
        domainId: domain,
        sourceSubjects: [] as Subject[],
        targetSubjects: [] as Subject[]
    } as PrismaSubjectPayload;
}

function dummyLecture(id: number, subjects: Subject[]) {
    return {
        id,
        subjects
    } as PrismaLecturePayload;
}

function dummyGraph(domains: PrismaDomainPayload[], subjects: PrismaSubjectPayload[], lectures: PrismaLecturePayload[]) {
	return {
		createdAt: new Date(),
		updatedAt: new Date(),
		domains,
        subjects,
        lectures
	} as PrismaGraphPayload;
}

function connectDomains(source: PrismaDomainPayload, target: PrismaDomainPayload) {
	source.targetDomains.push(target);
	target.sourceDomains.push(source);
}

function connectSubjects(source: PrismaSubjectPayload, target: PrismaSubjectPayload) {
    source.targetSubjects.push(target);
    target.sourceSubjects.push(source);
}

describe('Correct graph', () => {
    const a = dummyDomain(0, 'a', 'PROSPEROUS_RED');
    const b = dummyDomain(1, 'b', 'PROSPEROUS_RED');
    const c = dummyDomain(2, 'c', 'PROSPEROUS_RED');

    connectDomains(a, b);
    connectDomains(b, c);

    const x = dummySubject(0, 'x', 0);
    const y = dummySubject(1, 'y', 1);
    const z = dummySubject(2, 'z', 2);

    connectSubjects(x, y);
    connectSubjects(y, z);

    const l = dummyLecture(0, [y]);
    const graph = dummyGraph([a, b, c], [x, y, z], [l]);

    const d3 = new GraphD3(graph, true);

    test('Check domain nodes', () => {
        expect(d3.graph_data.domain_nodes.length).toBe(3);
        
        const fa = d3.graph_data.domain_nodes.find(n => n.id === 'domain-0');
        const fb = d3.graph_data.domain_nodes.find(n => n.id === 'domain-1');
        const fc = d3.graph_data.domain_nodes.find(n => n.id === 'domain-2');

        expect(fa).toEqual({
            id: 'domain-0',
            style: 'PROSPEROUS_RED',
            text: 'a',
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });

        expect(fb).toEqual({
            id: 'domain-1',
            style: 'PROSPEROUS_RED',
            text: 'b',
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });

        expect(fc).toEqual({
            id: 'domain-2',
            style: 'PROSPEROUS_RED',
            text: 'c',
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });
    });

    test('Check domain edges', () => {
        expect(d3.graph_data.domain_edges.length).toBe(2);
        
        const fa = d3.graph_data.domain_nodes.find(n => n.id === 'domain-0');
        const fb = d3.graph_data.domain_nodes.find(n => n.id === 'domain-1');
        const fc = d3.graph_data.domain_nodes.find(n => n.id === 'domain-2');

        expect(d3.graph_data.domain_edges).toContainEqual({
            id: 'domain-0-1',
            source: fa,
            target: fb
        });

        expect(d3.graph_data.domain_edges).toContainEqual({
            id: 'domain-1-2',
            source: fb,
            target: fc
        });
    });

    test('Check subject nodes', () => {
        expect(d3.graph_data.subject_nodes.length).toBe(3);

        const fa = d3.graph_data.domain_nodes.find(n => n.id === 'domain-0');
        const fb = d3.graph_data.domain_nodes.find(n => n.id === 'domain-1');
        const fc = d3.graph_data.domain_nodes.find(n => n.id === 'domain-2');
        const fx = d3.graph_data.subject_nodes.find(n => n.id === 'subject-0');
        const fy = d3.graph_data.subject_nodes.find(n => n.id === 'subject-1');
        const fz = d3.graph_data.subject_nodes.find(n => n.id === 'subject-2');

        expect(fx).toEqual({
            id: 'subject-0',
            style: 'PROSPEROUS_RED',
            text: 'x',
            parent: fa,
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });

        expect(fy).toEqual({
            id: 'subject-1',
            style: 'PROSPEROUS_RED',
            text: 'y',
            parent: fb,
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });

        expect(fz).toEqual({
            id: 'subject-2',
            style: 'PROSPEROUS_RED',
            text: 'z',
            parent: fc,
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });
    });

    test('Check subject edges', () => {
        expect(d3.graph_data.subject_edges.length).toBe(2);

        const fx = d3.graph_data.subject_nodes.find(n => n.id === 'subject-0');
        const fy = d3.graph_data.subject_nodes.find(n => n.id === 'subject-1');
        const fz = d3.graph_data.subject_nodes.find(n => n.id === 'subject-2');

        expect(d3.graph_data.subject_edges).toContainEqual({
            id: 'subject-0-1',
            source: fx,
            target: fy
        });

        expect(d3.graph_data.subject_edges).toContainEqual({
            id: 'subject-1-2',
            source: fy,
            target: fz
        });
    });

    test('Check lectures', () => {
        expect(d3.graph_data.lectures.length).toBe(1);

        const fl = d3.graph_data.lectures[0];
        const fb = d3.graph_data.domain_nodes.find(n => n.id === 'domain-1');
        const fx = d3.graph_data.subject_nodes.find(n => n.id === 'subject-0');
        const fy = d3.graph_data.subject_nodes.find(n => n.id === 'subject-1');
        const fz = d3.graph_data.subject_nodes.find(n => n.id === 'subject-2');
        const xy = d3.graph_data.subject_edges.find(e => e.id === 'subject-0-1');
        const yz = d3.graph_data.subject_edges.find(e => e.id === 'subject-1-2');

        expect(fl.past_nodes.length).toBe(1);
        expect(fl.past_nodes).toContainEqual(fx);

        expect(fl.present_nodes.length).toBe(1);
        expect(fl.present_nodes).toContainEqual(fy);

        expect(fl.future_nodes.length).toBe(1);
        expect(fl.future_nodes).toContainEqual(fz);

        expect(fl.domains.length).toBe(1);
        expect(fl.domains).toContainEqual(fb);

        expect(fl.nodes.length).toBe(3);
        expect(fl.nodes).toContainEqual(fx);
        expect(fl.nodes).toContainEqual(fy);
        expect(fl.nodes).toContainEqual(fz);

        expect(fl.edges.length).toBe(2);
        expect(fl.edges).toContainEqual(xy);
        expect(fl.edges).toContainEqual(yz);
    });
});

describe('Partial graph', () => {
    const a = dummyDomain(0, 'a', 'PROSPEROUS_RED');
    const b = dummyDomain(1, 'b');
    const c = dummyDomain(2, 'c', 'PROSPEROUS_RED');

    connectDomains(a, b);
    connectDomains(b, c);

    const x = dummySubject(0, 'x', 0);
    const y = dummySubject(1, 'y', 1);
    const z = dummySubject(2, 'z');

    connectSubjects(x, y);
    connectSubjects(y, z);

    const l = dummyLecture(0, [y]);
    const graph = dummyGraph([a, b, c], [x, y, z], [l]);

    const d3 = new GraphD3(graph, true);

    test('Check domain nodes', () => {
        expect(d3.graph_data.domain_nodes.length).toBe(2);
        
        const fa = d3.graph_data.domain_nodes.find(n => n.id === 'domain-0');
        const fc = d3.graph_data.domain_nodes.find(n => n.id === 'domain-2');

        expect(fa).toEqual({
            id: 'domain-0',
            style: 'PROSPEROUS_RED',
            text: 'a',
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });

        expect(fc).toEqual({
            id: 'domain-2',
            style: 'PROSPEROUS_RED',
            text: 'c',
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });
    });

    test('Check domain edges', () => {
        expect(d3.graph_data.domain_edges.length).toBe(0);
    });

    test('Check subject nodes', () => {
        expect(d3.graph_data.subject_nodes.length).toBe(1);

        const fa = d3.graph_data.domain_nodes.find(n => n.id === 'domain-0');
        const fx = d3.graph_data.subject_nodes.find(n => n.id === 'subject-0');

        expect(fx).toEqual({
            id: 'subject-0',
            style: 'PROSPEROUS_RED',
            text: 'x',
            parent: fa,
            x: 0,
            y: 0,
            fx: 0,
            fy: 0
        });
    });

    test('Check subject edges', () => {
        expect(d3.graph_data.subject_edges.length).toBe(0);
    });

    test('Check lectures', () => {
        expect(d3.graph_data.lectures.length).toBe(1);

        const fl = d3.graph_data.lectures[0];

        expect(fl.past_nodes.length).toBe(0);
        expect(fl.nodes.length).toBe(0);        
        expect(fl.present_nodes.length).toBe(0);
        expect(fl.future_nodes.length).toBe(0);
        expect(fl.domains.length).toBe(0);
        expect(fl.edges.length).toBe(0);
    });
});