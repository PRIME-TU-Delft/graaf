import * as settings from '$lib/settings';
import * as v from 'valibot';

export const createDomainSchema = v.object({
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

// Extend createDomainSchema
export const editDomainSchema = v.intersect([
	createDomainSchema,
	v.object({
		domainId: v.number()
	})
]);

export const deleteDomainSchema = v.object({
	graphId: v.pipe(v.number(), v.minValue(0, 'Invalid graph id')),
	domainId: v.pipe(v.number(), v.minValue(1, 'Invalid domain id'))
});

//
// Relations
//

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

export const reorderDomainsSchema = v.pipe(
	v.object({
		graphId: v.number(),
		domains: v.array(
			v.object({
				id: v.number(),
				order: v.number()
			})
		)
	}),
	v.check((data) => data.domains.length > 1, 'At least two domains are required')
);

export const changeColorSchema = v.pipe(
	v.object({
		graphId: v.number(),
		domainId: v.number(),
		style: v.nullable(v.picklist([...settings.COLOR_KEYS] as [string, ...string[]]))
	}),
	v.check((data) => data.domainId > 0, 'Invalid domain id')
);
