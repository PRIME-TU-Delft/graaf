import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const newGraphSchema = z.object({
	parentId: z.number(),
	parentType: z.enum(['SANDBOX', 'COURSE']),
	name: z.string().min(1).max(settings.MAX_GRAPH_NAME_LENGTH)
});

export const graphSchemaWithId = newGraphSchema.extend({
	graphId: z.number().min(1)
});

export const duplicateGraphSchema = z.object({
	graphId: z.number().min(1),
	newName: z.string().min(1).max(settings.MAX_GRAPH_NAME_LENGTH),
	destinationType: z.enum(['SANDBOX', 'COURSE']),
	destinationId: z.number().min(1)
});
