import { z } from 'zod';
import * as settings from '$lib/settings';

export const newProgramSchema = z.object({
	name: z.string().min(1).max(settings.MAX_PROGRAM_NAME_LENGTH)
});

export const deleteProgramSchema = z.object({
	programId: z.number().min(1)
});

export const editProgramSchema = z.object({
	programId: z.number().min(1),
	name: z.string().nonempty()
});

export const editSuperUserSchema = z.object({
	programId: z.number().min(1),
	userId: z.string(),
	role: z.enum(['admin', 'editor', 'revoke'])
});

export const linkingCoursesSchema = z.object({
	programId: z.number().min(1),
	courseIds: z.array(z.number().min(1)).nonempty()
});

