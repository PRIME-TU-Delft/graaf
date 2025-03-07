import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const programSchema = z.object({
	name: z.string().min(1).max(settings.MAX_PROGRAM_NAME_LENGTH)
});
