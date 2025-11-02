import { MAX_LECTURE_NAME_LENGTH } from '$lib/settings';
import * as v from 'valibot';

export const createLectureSchema = v.object({
	graphId: v.number(),
	name: v.pipe(
		v.string(),
		v.minLength(1),
		v.maxLength(
			MAX_LECTURE_NAME_LENGTH,
			`Lecture name cannot be longer than ${MAX_LECTURE_NAME_LENGTH} characters`
		)
	)
});

export const changeLectureNameSchema = v.object({
	...createLectureSchema.entries,
	lectureId: v.number()
});

export const changeLectureSubjectsSchema = v.object({
	graphId: v.number(),
	lectureId: v.number(),
	subjects: v.array(v.number())
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
