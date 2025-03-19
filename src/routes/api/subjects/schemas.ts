
import { z } from 'zod';

export const patchOrderSchema = z.array(
    z.object({
        subjectId: z.number(),
        oldOrder: z.number(),
        newOrder: z.number()
    })
);

export const patchPositionSchema = z.array(
	z.object({
		subjectId: z.number(),
		x: z.number(),
		y: z.number()
	})
);