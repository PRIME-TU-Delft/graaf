import { MAX_LECTURE_NAME_LENGTH } from '$lib/settings';
import { z } from 'zod';

export const lectureSchema = z.object({
	graphId: z.number(),
	lectureId: z.number(),
	name: z.string().min(1).max(MAX_LECTURE_NAME_LENGTH),
	subjectIds: z.array(z.number())
});

export const deleteLectureSchema = z.object({
	graphId: z.number(),
	lectureId: z.number()
});

export const reorderLecturesSchema = z.array(
	z.object({
		lectureId: z.number(),
		newOrder: z.number()
	})
);
