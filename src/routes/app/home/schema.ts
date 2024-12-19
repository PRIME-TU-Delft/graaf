import * as settings from '$scripts/settings';
import { z } from 'zod';

export const programSchema = z.object({
	name: z.string().min(2).max(settings.MAX_PROGRAM_NAME_LENGTH)

	// TODO: add $programs.some((program) => program.trimmed_name === this.name.trim())
});

export type ProgramSchema = typeof programSchema;
