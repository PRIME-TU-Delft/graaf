import * as v from 'valibot';

export const patchOrderSchema = v.array(
	v.object({
		lectureId: v.number(),
		newOrder: v.number()
	})
);
