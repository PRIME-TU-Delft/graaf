import * as settings from '$lib/settings';
import * as v from 'valibot';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible from the client

export const createSubjectSchema = v.object({
	graphId: v.pipe(v.number(), v.minValue(1, 'Invalid graph id')),
	name: v.pipe(
		v.string(),
		v.minLength(1, 'Subject name must be at least 1 character long'),
		v.maxLength(
			settings.MAX_SUBJECT_NAME_LENGTH,
			`Subject name must be at most ${settings.MAX_SUBJECT_NAME_LENGTH} characters long`
		)
	),
	domainId: v.number()
});

export const subjectSchema = v.object({
	...createSubjectSchema.entries,
	subjectId: v.number()
});

export const deleteSubjectSchema = v.object({
	graphId: v.pipe(v.number(), v.minValue(1, 'Invalid graph id')),
	subjectId: v.pipe(v.number(), v.minValue(1, 'Invalid subject id'))
});

export const subjectRelSchema = v.pipe(
	v.object({
		graphId: v.number(),
		sourceSubjectId: v.pipe(v.number(), v.minValue(0, 'Please select a source subject')),
		targetSubjectId: v.pipe(v.number(), v.minValue(0, 'Please select a target domain'))
	}),
	v.check(
		(data) => data.sourceSubjectId !== data.targetSubjectId,
		'Source and target subject must not be the same'
	)
);

export const changeSubjectRelSchema = v.pipe(
	v.object({
		...subjectRelSchema.entries,
		oldSourceSubjectId: v.pipe(v.number(), v.minValue(0, 'Please select a source subject')),
		oldTargetSubjectId: v.pipe(v.number(), v.minValue(0, 'Please select a target subject'))
	}),
	v.check(
		(data) =>
			data.oldSourceSubjectId !== data.sourceSubjectId ||
			data.oldTargetSubjectId !== data.targetSubjectId,
		'This is the original relationship, change either one'
	),
	v.check(
		(data) => data.sourceSubjectId !== data.targetSubjectId,
		'Source and target subject must not be the same'
	)
);
