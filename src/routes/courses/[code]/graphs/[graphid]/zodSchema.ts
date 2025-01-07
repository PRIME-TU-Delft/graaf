import { z } from 'zod';
import * as settings from '$lib/utils/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const domainSchema = z.object({
	graphId: z.number(),
	name: z.string().min(1).max(settings.MAX_DOMAIN_NAME_LENGTH),
	color: z.enum(['', ...settings.COLOR_KEYS] as [string, ...string[]])
});
