import { GraphD3 } from '$lib/d3/GraphD3';

import type { SavePositions } from '$lib/d3/types';
import type { GraphStore } from '$lib/graph/graphStore.svelte';

/**
 * Holds the currently mounted GraphD3 instance as Svelte 5 rune-based reactive state, so components
 * can read/react to which graph (if any) is currently mounted, since GraphD3 itself is a plain
 * (non-reactive) class driving an imperative D3 canvas.
 */
class GraphD3Store {
	/** The currently mounted graph instance, or undefined while no canvas is mounted. */
	graphD3 = $state<GraphD3>();

	constructor() {}

	/**
	 * Construct the canvas for an `<svg>` element and bind it to the graph store, which owns the
	 * data it renders: the store hands it the projection to start from, pushes a new one whenever
	 * the graph changes, and records the node positions the canvas moves.
	 *
	 * @param d3Canvas - The `<svg>` element to render into
	 * @param store - The graph store owning the graph being rendered
	 * @param options.editable - Whether this is the authenticated editor or the read-only viewer
	 * @param options.view - Which view to open on
	 * @param options.lectureID - The lecture to focus, when `view` is 'LECTURES'
	 * @param options.savePositions - Called with the nodes a drag or the simulation moved. Omitted
	 * in the read-only public viewer, where nodes cannot be moved.
	 * @returns The mounted canvas, to hand back to `unmount` when it goes away
	 */
	mount(
		d3Canvas: SVGSVGElement,
		store: GraphStore,
		options: {
			editable: boolean;
			view: 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
			lectureID: number | null;
			savePositions?: SavePositions;
		}
	): GraphD3 {
		const canvas = new GraphD3(
			d3Canvas,
			store.graphData,
			options.editable,
			options.view,
			options.lectureID,
			options.savePositions
		);

		store.attachCanvas(canvas);
		this.graphD3 = canvas;

		return canvas;
	}

	/**
	 * Unbind a canvas that is going away, so the store stops pushing at it.
	 *
	 * @param canvas - The canvas returned by the matching `mount` call
	 * @param store - The graph store it was bound to
	 */
	unmount(canvas: GraphD3, store: GraphStore) {
		store.detachCanvas(canvas);

		if (this.graphD3 === canvas) this.graphD3 = undefined;
	}
}

/** The single shared GraphD3Store instance. */
export const graphD3Store = new GraphD3Store();
