import { z } from 'zod';
import * as settings from '$lib/settings';

// This is a Zod schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible from the client

export const subjectSchema = z.object({
	subjectId: z.number(),
	graphId: z.number(),
	name: z.string().min(1).max(settings.MAX_SUBJECT_NAME_LENGTH),
	domainId: z.number()
});

export const deleteSubjectSchema = z.object({
	graphId: z.number().min(1, 'Invalid graph id'),
	subjectId: z.number().min(1, 'Invalid subject id'),
	sourceSubjects: z.array(z.number()),
	targetSubjects: z.array(z.number())
});

export const subjectRelSchema = z
	.object({
		graphId: z.number(),
		sourceSubjectId: z.number().gt(0, 'Please select a source subject'),
		targetSubjectId: z.number().gt(0, 'Please select a target subject')
	})
	.refine((data) => data.sourceSubjectId !== data.targetSubjectId, {
		message: 'sourceSubjectId and targetSubjectId must not be the same',
		path: ['sourceSubjectId', 'targetSubjectId']
	});

export const changeSubjectRelSchema = z
	.object({
		graphId: z.number(),
		oldSourceSubjectId: z.number().gt(0, 'Please select a source subject'),
		oldTargetSubjectId: z.number().gt(0, 'Please select a target subject'),
		sourceSubjectId: z.number().gt(0, 'Please select a source subject'),
		targetSubjectId: z.number().gt(0, 'Please select a target subject')
	})
	.refine((data) => data.sourceSubjectId !== data.targetSubjectId, {
		message: 'sourceSubjectId and targetSubjectId must not be the same',
		path: ['sourceSubjectId', 'targetSubjectId']
	});

export const reorderSubjectsSchema = z.object({
	graphId: z.number(),
	subjectIds: z.array(z.number())
});
