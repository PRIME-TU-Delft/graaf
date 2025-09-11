import * as v from 'valibot';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const newSandboxSchema = v.object({
	ownerId: v.string(),
	name: v.pipe(
		v.string(),
		v.minLength(1, "Your name can't be empty"),
		v.maxLength(
			settings.MAX_COURSE_NAME_LENGTH,
			`Your name can't be longer than ${settings.MAX_COURSE_NAME_LENGTH} characters`
		)
	)
});

export const editSandboxSchema = v.object({
	sandboxId: v.number(),
	name: v.pipe(
		v.string(),
		v.minLength(1, "Your name can't be empty"),
		v.maxLength(
			settings.MAX_COURSE_NAME_LENGTH,
			`Your name can't be longer than ${settings.MAX_COURSE_NAME_LENGTH} characters`
		)
	)
});

export const deleteSandboxSchema = v.object({
	sandboxId: v.number()
});

export const editSuperUserSchema = v.object({
	sandboxId: v.number(),
	userId: v.string(),
	role: v.picklist(['owner', 'editor', 'revoke'])
});
