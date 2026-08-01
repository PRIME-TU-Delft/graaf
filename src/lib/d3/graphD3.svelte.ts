import { GraphD3 } from '$lib/d3/GraphD3';
import type { PrismaGraphPayload } from '$lib/d3/types';

/**
 * Holds the current GraphD3 instance as Svelte 5 rune-based reactive state, so components can
 * read/react to which graph (if any) is currently mounted, since GraphD3 itself is a plain
 * (non-reactive) class driving an imperative D3 canvas.
 */
class GraphD3Store {
	/** The currently mounted graph instance, or undefined before setGraphD3 has been called. */
	graphD3 = $state<GraphD3>();

	constructor() {}

	/**
	 * Construct a new GraphD3 instance for the given SVG element and payload, replacing any
	 * previously stored one.
	 *
	 * @param d3Canvas - The `<svg>` element to render into
	 * @param payload - The raw Prisma graph payload to format and render
	 * @param editable - Whether the graph is being viewed in the authenticated editor or the
	 * read-only public viewer
	 * @param view - Which view to open on
	 * @param lectureId - If provided, the lecture to focus when `view` is 'LECTURES'
	 */
	setGraphD3(
		d3Canvas: SVGSVGElement,
		payload: PrismaGraphPayload,
		editable: boolean,
		view: 'DOMAINS' | 'SUBJECTS' | 'LECTURES' = 'DOMAINS',
		lectureId: number | null = null
	) {
		this.graphD3 = new GraphD3(d3Canvas, payload, editable, view, lectureId);
	}
}

/** The single shared GraphD3Store instance. */
export const graphD3Store = new GraphD3Store();
