import * as settings from '$lib/settings';
import * as v from 'valibot';

export const patchOrderSchema = v.array(
	v.object({
		domainId: v.number(),
		newOrder: v.number()
	})
);

export const patchPositionSchema = v.array(
	v.object({
		domainId: v.number(),
		x: v.number(),
		y: v.number()
	})
);

export const patchStyleSchema = v.object({
	domainId: v.number(),
	style: v.optional(v.pipe(v.picklist(settings.COLOR_KEYS as [string, ...string[]])))
});
