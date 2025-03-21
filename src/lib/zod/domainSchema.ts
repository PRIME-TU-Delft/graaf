import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible from the client

export const domainSchema = z.object({
	domainId: z.number(),
	graphId: z.number().nonnegative('Invalid graph id'),
	name: z.string().min(1).max(settings.MAX_DOMAIN_NAME_LENGTH),
	style: z.enum(['', ...settings.COLOR_KEYS] as [string, ...string[]])
});

export const deleteDomainSchema = z.object({
	domainId: z.number().min(1, 'Invalid domain id'),
	sourceDomains: z.array(z.number()),
	targetDomains: z.array(z.number()),
	connectedSubjects: z.array(z.number())
});

export const domainRelSchema = z
	.object({
		graphId: z.number(),
		sourceDomainId: z.number().gt(0, 'Please select a source domain'),
		targetDomainId: z.number().gt(0, 'Please select a target domain')
	})
	.refine((data) => data.sourceDomainId !== data.targetDomainId, {
		message: 'sourceDomainId and targetDomainId must not be the same',
		path: ['sourceDomainId', 'targetDomainId']
	});

export const changeDomainRelSchema = z
	.object({
		graphId: z.number(),
		oldSourceDomainId: z.number().gt(0, 'Please select an source domain'),
		oldTargetDomainId: z.number().gt(0, 'Please select an target domain'),
		sourceDomainId: z.number().gt(0, 'Please select a new source domain'),
		targetDomainId: z.number().gt(0, 'Please select a new target domain')
	})
	.refine((data) => data.sourceDomainId !== data.targetDomainId, {
		message: 'sourceDomainId and targetDomainId must not be the same'
	})
	.refine(
		(data) =>
			data.sourceDomainId !== data.oldSourceDomainId &&
			data.targetDomainId !== data.oldTargetDomainId,
		{
			message: 'This is the original relationship, change either one'
		}
	);
