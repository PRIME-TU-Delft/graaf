import * as settings from '$lib/settings';
import * as v from 'valibot';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const newGraphSchema = v.object({
	parentId: v.number(),
	parentType: v.picklist(['SANDBOX', 'COURSE']),
	name: v.pipe(v.string(), v.minLength(1), v.maxLength(settings.MAX_GRAPH_NAME_LENGTH))
});

export const graphSchemaWithId = v.object({
	...newGraphSchema.entries,
	graphId: v.pipe(v.number(), v.minValue(1))
});

export const duplicateGraphSchema = v.object({
	graphId: v.pipe(v.number(), v.minValue(1)),
	newName: v.pipe(v.string(), v.minLength(1), v.maxLength(settings.MAX_GRAPH_NAME_LENGTH)),
	destinationType: v.picklist(['SANDBOX', 'COURSE']),
	destinationId: v.pipe(v.number(), v.minValue(1))
});
