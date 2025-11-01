import { MAX_LECTURE_NAME_LENGTH } from '$lib/settings';
import * as v from 'valibot';

export const lectureSchema = v.object({
	graphId: v.number(),
	lectureId: v.number(),
	name: v.pipe(
		v.string(),
		v.minLength(1),
		v.maxLength(
			MAX_LECTURE_NAME_LENGTH,
			`Lecture name cannot be longer than ${MAX_LECTURE_NAME_LENGTH} characters`
		)
	),
	subjectIds: v.array(v.number())
});

export const deleteLectureSchema = v.object({
	graphId: v.number(),
	lectureId: v.number()
});

export const reorderLecturesSchema = v.object({
	graphId: v.number(),
	lectures: v.array(
		v.object({
			lectureId: v.number(),
			newOrder: v.number()
		})
	)
});

export const moveSubjectToLectureSchema = v.object({
	graphId: v.number(),
	subjectId: v.number(),
	lectureId: v.number(),
	newLectureId: v.number()
});
