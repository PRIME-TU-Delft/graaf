import { z } from 'zod';
import * as settings from '$lib/settings';

export const patchOrderSchema = z.array(
	z.object({
		domainId: z.number(),
		oldOrder: z.number(),
		newOrder: z.number()
	})
);

export const patchPositionSchema = z.array(
	z.object({
		domainId: z.number(),
		x: z.number(),
		y: z.number()
	})
);

export const patchStyleSchema = z.object({
	domainId: z.number(),
	style: z.enum(settings.COLOR_KEYS as [string, ...string[]]).nullable()
});
