import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const editSandboxSchema = z.object({
	sandboxId: z.number(),
	name: z.string().nonempty().max(settings.MAX_COURSE_NAME_LENGTH)
});

export const deleteSandboxSchema = z.object({
	sandboxId: z.number()
});

export const editSuperUserSchema = z.object({
	sandboxId: z.number(),
	userId: z.string(),
	role: z.enum(['owner', 'editor', 'revoke'])
});

