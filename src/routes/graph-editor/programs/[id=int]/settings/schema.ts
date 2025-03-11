import { z } from 'zod';

export const formSchema = z.object({
	programId: z.number().min(1),
	isArchived: z.boolean()
});

export type FormSchema = typeof formSchema;
