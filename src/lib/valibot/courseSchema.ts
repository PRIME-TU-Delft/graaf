import * as v from 'valibot';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client
export const newCourseSchema = v.object({
	code: v.pipe(
		v.string(),
		v.nonEmpty(),
		v.maxLength(settings.MAX_COURSE_CODE_LENGTH),
		v.regex(settings.COURSE_CODE_REGEX, 'Course code must be alphanumeric without any spaces')
	),
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(settings.MAX_COURSE_NAME_LENGTH)),
	programId: v.number()
});

export const editCourseSchema = v.object({
	courseId: v.number(),
	name: v.pipe(v.string(), v.nonEmpty(), v.maxLength(settings.MAX_COURSE_NAME_LENGTH))
});

export const editSuperUserSchema = v.object({
	courseId: v.number(),
	userId: v.string(),
	role: v.picklist(['admin', 'editor', 'revoke'])
});

export const linkingCoursesSchema = v.object({
	programId: v.pipe(v.number(), v.minValue(1)),
	courseIds: v.pipe(v.array(v.number()), v.minLength(1, 'At least one course ID is required'))
});

export const changeArchiveSchema = v.object({
	courseId: v.number(),
	archive: v.boolean()
});

export const changePinSchema = v.object({
	courseId: v.number(),
	pin: v.boolean()
});

export const deleteCourseSchema = v.object({
	courseId: v.pipe(v.number(), v.minValue(1))
});
