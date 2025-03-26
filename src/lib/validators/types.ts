
import type { Prisma } from "@prisma/client";

export type PrismaGraphPayload = Prisma.GraphGetPayload<{
	include: {
		domains: {
			include: {
				sourceDomains: true;
				targetDomains: true;
			}
		}
		subjects: {
			include: {
				sourceSubjects: true;
				targetSubjects: true;
			}
		};
	}
}>;

export type PrismaDomainPayload = Prisma.DomainGetPayload<{
	include: {
		sourceDomains: true;
		targetDomains: true;
	}
}>;

export type PrismaSubjectPayload = Prisma.SubjectGetPayload<{
	include: {
		sourceSubjects: true;
		targetSubjects: true;
	}
}>;

export type AbstractNode = {
	id: number;
	sources: AbstractNode[];
	targets: AbstractNode[];
}

export type AbstractEdge = {
	source: AbstractNode;
	target: AbstractNode;
}

export type AbstractGraph = Map<number, AbstractNode>;

export type Issues = {
	domainCycles: { source: number, target: number }[][];
	subjectCycles: { source: number, target: number }[][];
	conflictingEdges: { source: number, target: number }[];
}