import { z } from 'zod';
import * as settings from '$lib/utils/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const domainSchema = z.object({
	graphId: z.number(),
	name: z.string().min(1).max(settings.MAX_DOMAIN_NAME_LENGTH),
	color: z.enum(['', ...settings.COLOR_KEYS] as [string, ...string[]])
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

// Subjects
export const subjectSchema = z.object({
	graphId: z.number(),
	name: z.string().min(1).max(settings.MAX_SUBJECT_NAME_LENGTH),
	domainId: z.number()
});
