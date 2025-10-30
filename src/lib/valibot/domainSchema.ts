import * as settings from '$lib/settings';
import * as v from 'valibot';

// This is a Valibot schema for validating forms this cannot be automatically generated
// from the database schema because that is not accessible from the client

export const domainSchema = v.object({
	domainId: v.number(),
	graphId: v.pipe(v.number(), v.minValue(0, 'Invalid graph id')),
	name: v.pipe(
		v.string(),
		v.minLength(1, 'Please enter a name'),
		v.maxLength(
			settings.MAX_DOMAIN_NAME_LENGTH,
			`Name is too long, max ${settings.MAX_DOMAIN_NAME_LENGTH} characters`
		)
	),
	style: v.picklist(['', ...settings.COLOR_KEYS] as [string, ...string[]])
});

export const deleteDomainSchema = v.object({
	graphId: v.pipe(v.number(), v.minValue(0, 'Invalid graph id')),
	domainId: v.pipe(v.number(), v.minValue(1, 'Invalid domain id')),
	sourceDomains: v.array(v.number()),
	targetDomains: v.array(v.number()),
	connectedSubjects: v.array(v.number())
});
export const domainRelSchema = v.pipe(
	v.object({
		graphId: v.number(),
		sourceDomainId: v.pipe(v.number(), v.minValue(1, 'Please select a source domain')),
		targetDomainId: v.pipe(v.number(), v.minValue(1, 'Please select a target domain'))
	}),
	v.check(
		(data) => data.sourceDomainId !== data.targetDomainId,
		'Source and target domain must not be the same'
	)
);

export const changeDomainRelSchema = v.pipe(
	v.object({
		graphId: v.number(),
		oldSourceDomainId: v.pipe(v.number(), v.minValue(1, 'Please select an source domain')),
		oldTargetDomainId: v.pipe(v.number(), v.minValue(1, 'Please select an target domain')),
		sourceDomainId: v.pipe(v.number(), v.minValue(1, 'Please select a new source domain')),
		targetDomainId: v.pipe(v.number(), v.minValue(1, 'Please select a new target domain'))
	}),
	v.check(
		(data) => data.sourceDomainId !== data.targetDomainId,
		'Source and target domain must not be the same'
	),
	v.check(
		(data) =>
			data.sourceDomainId !== data.oldSourceDomainId ||
			data.targetDomainId !== data.oldTargetDomainId,
		'This is the original relationship, change either one'
	)
);
