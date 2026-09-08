import type { Prisma } from '@prisma/client';

/**
 * The `include` shape needed to render a graph: domains and subjects with their relation edges and
 * a subject's parent domain, plus lectures with their subjects, each ordered for display.
 *
 * This is the single declaration of what "a renderable graph" is. `GraphActions.getRenderablePayload`
 * queries with it and every type below is derived from it, so a schema change only has to be made
 * here and cannot leave a hand-written copy of the shape behind.
 *
 * It lives outside `$lib/server` because the components and validators that consume the result need
 * the derived types, while only the query itself needs the value.
 */
export const renderableGraphInclude = {
	domains: {
		include: {
			sourceDomains: true,
			targetDomains: true
		},
		orderBy: { order: 'asc' as const }
	},
	subjects: {
		include: {
			sourceSubjects: true,
			targetSubjects: true,
			domain: true
		},
		orderBy: { order: 'asc' as const }
	},
	lectures: {
		include: {
			subjects: true
		},
		orderBy: { order: 'asc' as const }
	}
} satisfies Prisma.GraphInclude;

/** A graph with everything needed to render and validate it, as the loaders return it. */
export type RenderableGraph = Prisma.GraphGetPayload<{
	include: typeof renderableGraphInclude;
}>;

/** One domain of a RenderableGraph, with its relation edges. */
export type RenderableDomain = RenderableGraph['domains'][number];

/** One subject of a RenderableGraph, with its relation edges and its parent domain. */
export type RenderableSubject = RenderableGraph['subjects'][number];

/** One lecture of a RenderableGraph, with its subjects. */
export type RenderableLecture = RenderableGraph['lectures'][number];
