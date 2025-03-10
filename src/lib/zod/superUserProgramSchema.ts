import { z } from 'zod';

export const deleteProgramSchema = z.object({
	programId: z.string().nonempty()
});

export const editUsersSchema = z.object({
	programId: z.string().nonempty(),
	name: z.string().nonempty(),
	editors: z.array(z.string().nonempty()), // user ids
	admins: z.array(z.string().nonempty()) // user ids
});

export const editSuperUserSchema = z.object({
	programId: z.string().nonempty(),
	userId: z.string(),
	role: z.enum(['admin', 'editor', 'revoke'])
});

export const linkingCoursesSchema = z.object({
	programId: z.string().nonempty(),
	courseCodes: z.array(z.string().nonempty()).nonempty()
});
