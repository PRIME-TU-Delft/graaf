import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible at from the client

export const courseSchema = z.object({
	code: z
		.string()
		.nonempty()
		.max(settings.MAX_COURSE_CODE_LENGTH)
		.regex(settings.COURSE_CODE_REGEX, 'Course code must be alphanumeric without any spaces'),
	name: z.string().nonempty().max(settings.MAX_COURSE_NAME_LENGTH),
	programId: z.number()
});

export const editSuperUserSchema = z.object({
	courseCode: z
		.string()
		.nonempty()
		.max(settings.MAX_COURSE_CODE_LENGTH)
		.regex(settings.COURSE_CODE_REGEX, 'Course code must be alphanumeric without any spaces'),
	userId: z.string(),
	role: z.enum(['admin', 'editor', 'revoke'])
});

export const changeArchive = z.object({
	code: z
		.string()
		.nonempty()
		.max(settings.MAX_COURSE_CODE_LENGTH)
		.regex(settings.COURSE_CODE_REGEX, 'Course code must be alphanumeric without any spaces'),
	archive: z.boolean()
});
