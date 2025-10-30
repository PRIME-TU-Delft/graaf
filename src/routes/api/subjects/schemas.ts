import * as v from 'valibot';

export const patchOrderSchema = v.array(
	v.object({
		subjectId: v.number(),
		newOrder: v.number()
	})
);

export const patchPositionSchema = v.array(
	v.object({
		subjectId: v.number(),
		x: v.number(),
		y: v.number()
	})
);
