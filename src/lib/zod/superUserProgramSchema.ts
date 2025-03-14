import { z } from 'zod';

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
	courseCodes: z.array(z.string().nonempty()).nonempty()
});
