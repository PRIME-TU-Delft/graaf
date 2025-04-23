
import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const newLinkSchema = z.object({
	parentId: z.number(),
    parentType: z.enum(['SANDBOX', 'COURSE']),
    graphId: z.number().min(1),
	name: z
		.string()
		.min(1)
		.max(settings.MAX_LINK_NAME_LENGTH)
		.regex(/^[a-zA-Z-]+$/, 'Only letters and `-` without a space are allowed')
});

export const editLinkSchema = z.object({
	parentId: z.number(),
    parentType: z.enum(['SANDBOX', 'COURSE']),
    graphId: z.number().min(1),
	linkId: z.number().min(1)
});
