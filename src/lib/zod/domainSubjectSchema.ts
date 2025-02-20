import { z } from 'zod';
import * as settings from '$lib/utils/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const domainSchema = z.object({
	domainId: z.number(), // Optional for new domains
	graphId: z.number().nonnegative('Invalid graph id'),
	name: z.string().min(1).max(settings.MAX_DOMAIN_NAME_LENGTH),
	color: z.enum(['', ...settings.COLOR_KEYS] as [string, ...string[]])
});

export const deleteDomainSchema = z.object({
	domainId: z.number().min(1, 'Invalid domain id'),
	incommingDomains: z.array(z.number()),
	outgoingDomains: z.array(z.number()),
	connectedSubjects: z.array(z.number())
});

export const domainRelSchema = z
	.object({
		graphId: z.number(),
		domainInId: z.number().gt(0, 'Please select an in domain'),
		domainOutId: z.number().gt(0, 'Please select an out domain')
	})
	.refine((data) => data.domainInId !== data.domainOutId, {
		message: 'domainInId and domainOutId must not be the same',
		path: ['domainInId', 'domainOutId']
	});

export const changeDomainRelSchema = z
	.object({
		graphId: z.number(),
		oldDomainInId: z.number().gt(0, 'Please select an in domain'),
		oldDomainOutId: z.number().gt(0, 'Please select an out domain'),
		domainInId: z.number().gt(0, 'Please select a new in domain'),
		domainOutId: z.number().gt(0, 'Please select a new out domain')
	})
	.refine((data) => data.domainInId !== data.domainOutId, {
		message: 'domainInId and domainOutId must not be the same'
	})
	.refine(
		(data) => data.domainInId !== data.oldDomainInId && data.domainOutId !== data.oldDomainOutId,
		{
			message: 'This is the original relationship, change either one'
		}
	);

// Subjects
export const subjectSchema = z.object({
	subjectId: z.number(), // Optional for new domains
	graphId: z.number(),
	name: z.string().min(1).max(settings.MAX_SUBJECT_NAME_LENGTH),
	domainId: z.number()
});

export const deleteSubjectSchema = z.object({
	subjectId: z.number().min(1, 'Invalid subject id'),
	incommingSubjects: z.array(z.number()),
	outgoingSubjects: z.array(z.number())
});

export const subjectRelSchema = z.object({
	graphId: z.number(),
	subjectInId: z.number().gt(0, 'Please select an in subject'),
	subjectOutId: z.number().gt(0, 'Please select an out domain')
});
