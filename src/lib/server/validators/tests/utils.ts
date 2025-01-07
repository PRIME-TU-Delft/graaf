import type { DomainType, GraphType } from '../graphValidator';

export function dummyDomain(name: string, id: number) {
	return {
		name,
		id,
		style: null,
		x: 0,
		y: 0,
		order: 0,
		incommingDomains: [],
		outgoingDomains: [],
		graphId: 0
	} as DomainType;
}

export function dummyGraph(domains: DomainType[]) {
	return {
		name: 'graph',
		id: 0,
		courseId: 'CSE2000',
		createdAt: new Date(),
		updatedAt: new Date(),
		domains: domains
	} as GraphType;
}

export function addConnection(from: DomainType, to: DomainType) {
	from.outgoingDomains.push(to);
	to.incommingDomains.push(from);
}
