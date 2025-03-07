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

export const addUser = z.object({
	programId: z.string().nonempty(),
	userId: z.string(),
	isAdmin: z.boolean()
});
