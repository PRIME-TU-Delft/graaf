import { z } from 'zod';

export const patchOrderSchema = z.array(
	z.object({
		lectureId: z.number(),
		newOrder: z.number()
	})
);
