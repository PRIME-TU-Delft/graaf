import * as v from 'valibot';
import * as settings from '$lib/settings';
export const newProgramSchema = v.object({
	name: v.pipe(
		v.string('Your name should be a string'),
		v.minLength(1, "Your name can't be empty"),
		v.maxLength(
			settings.MAX_PROGRAM_NAME_LENGTH,
			`Your name can't be longer than ${settings.MAX_PROGRAM_NAME_LENGTH} characters`
		)
	)
});

export const deleteProgramSchema = v.object({
	programId: v.pipe(
		v.number('Program ID must be a number'),
		v.minValue(1, 'Program ID must be at least 1')
	)
});

export const editProgramSchema = v.object({
	programId: v.pipe(
		v.number('Program ID must be a number'),
		v.minValue(1, 'Program ID must be at least 1')
	),
	name: v.pipe(v.string('Name must be a string'), v.minLength(1, "Name can't be empty"))
});

export const editSuperUserSchema = v.object({
	programId: v.pipe(
		v.number('Program ID must be a number'),
		v.minValue(1, 'Program ID must be at least 1')
	),
	userId: v.string('User ID must be a string'),
	role: v.union(
		[v.literal('admin'), v.literal('editor'), v.literal('revoke')],
		'Role must be one of: admin, editor, revoke'
	)
});

export const linkingCoursesSchema = v.object({
	programId: v.pipe(
		v.number('Program ID must be a number'),
		v.minValue(1, 'Program ID must be at least 1')
	),
	courseIds: v.pipe(
		v.array(
			v.pipe(v.number('Course ID must be a number'), v.minValue(1, 'Course ID must be at least 1')),
			'Course IDs must be an array'
		),
		v.minLength(1, 'At least one course ID is required')
	)
});
