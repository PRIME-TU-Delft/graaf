import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const newCourseSchema = z.object({
	code: z
		.string()
		.nonempty()
		.max(settings.MAX_COURSE_CODE_LENGTH)
		.regex(settings.COURSE_CODE_REGEX, 'Course code must be alphanumeric without any spaces'),
	name: z.string().nonempty().max(settings.MAX_COURSE_NAME_LENGTH),
	programId: z.number()
});

export const editCourseSchema = z.object({
	courseId: z.number(),
	name: z.string().nonempty().max(settings.MAX_COURSE_NAME_LENGTH)
});

export const editSuperUserSchema = z.object({
	courseId: z.number(),
	userId: z.string(),
	role: z.enum(['admin', 'editor', 'revoke'])
});

export const linkingCoursesSchema = z.object({
	programId: z.number().min(1),
	courseIds: z.array(z.number()).nonempty()
});

export const changeArchiveSchema = z.object({
	courseId: z.number(),
	archive: z.boolean()
});

export const changePinSchema = z.object({
	courseId: z.number(),
	pin: z.boolean()
});

export const deleteCourseSchema = z.object({
	courseId: z.number().min(1)
})
