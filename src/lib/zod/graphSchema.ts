import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const graphSchema = z.object({
	courseCode: z.string(),
	name: z.string().min(1).max(settings.MAX_GRAPH_NAME_LENGTH)
});

export const graphSchemaWithId = graphSchema.extend({
	graphId: z.number().min(1)
});

export const duplicateGraphSchema = z.object({
	destinationCourseCode: z.string().min(1).max(settings.MAX_COURSE_CODE_LENGTH),
	newName: z.string().min(1).max(settings.MAX_GRAPH_NAME_LENGTH),
	graphId: z.number().min(1)
});

export const createNewLinkSchema = z.object({
	graphId: z.number().min(1),
	courseId: z.number().min(1),
	name: z
		.string()
		.min(1)
		.max(settings.MAX_LINK_NAME_LENGTH)
		.regex(/^[a-zA-Z-]+$/, 'Only letters and `-` without a space are allowed')
});

export const editLinkSchema = z.object({
	graphId: z.number().min(1),
	courseId: z.number().min(1),
	linkId: z.number().min(1)
});
