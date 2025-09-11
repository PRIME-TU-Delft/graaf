import * as v from 'valibot';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const newLinkSchema = v.object({
	parentId: v.number(),
	parentType: v.picklist(['SANDBOX', 'COURSE']),
	graphId: v.pipe(v.number(), v.minValue(1)),
	name: v.pipe(
		v.string(),
		v.minLength(1),
		v.maxLength(settings.MAX_LINK_NAME_LENGTH),
		v.regex(/^[a-zA-Z0-9-]+$/, 'Only letters and `-` without a space are allowed')
	)
});

export const editLinkSchema = v.object({
	parentId: v.number(),
	parentType: v.picklist(['SANDBOX', 'COURSE']),
	graphId: v.pipe(v.number(), v.minValue(1)),
	linkId: v.pipe(v.number(), v.minValue(1))
});
