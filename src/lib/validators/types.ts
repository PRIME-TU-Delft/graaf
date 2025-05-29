import type { Prisma } from '@prisma/client';

export type PrismaGraphPayload = Prisma.GraphGetPayload<{
	include: {
		domains: {
			include: {
				sourceDomains: true;
				targetDomains: true;
			};
		};
		subjects: {
			include: {
				sourceSubjects: true;
				targetSubjects: true;
			};
		};
		lectures: {
			include: {
				subjects: true;
			};
		};
	};
}>;

export type PrismaDomainPayload = Prisma.DomainGetPayload<{
	include: {
		sourceDomains: true;
		targetDomains: true;
	};
}>;

export type PrismaSubjectPayload = Prisma.SubjectGetPayload<{
	include: {
		sourceSubjects: true;
		targetSubjects: true;
	};
}>;

export type Issue = {
	title: string;
	message: string;
	severity: 'error' | 'warning';
};

export type Issues = {
	domainIssues: { [key: number]: Issue[] };
	domainRelationIssues: { [key: number]: { [key: number]: Issue[] } };
	subjectIssues: { [key: number]: Issue[] };
	subjectRelationIssues: { [key: number]: { [key: number]: Issue[] } };
	lectureIssues: { [key: number]: { 'lecture': Issue[], 'subjects': { [key: number]: Issue[] } } };
};
