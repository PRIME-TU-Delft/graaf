import { z } from 'zod';

export const formSchema = z.object({
	programId: z.string().nonempty(),
	isArchived: z.boolean()
});

export type FormSchema = typeof formSchema;
