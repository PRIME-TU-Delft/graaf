import * as settings from '$lib/settings';
import type { GraphD3 } from './GraphD3';

export { OverlayToolbox };

// -----------------------------> Classes

/**
 * Renders full-canvas overlays shown above the graph content: an error state, and the transient
 * "Shift + Scroll to zoom" hint shown when a user scrolls on a locked (non-editable) graph.
 */
class OverlayToolbox {
	/**
	 * Remove any current overlay content and reset the overlay layer to its default (fully
	 * opaque, interactive) state. Interrupts any in-progress overlay transition first.
	 *
	 * @param graph - The graph instance to clear the overlay of
	 */
	static clear(graph: GraphD3) {
		graph.overlay
			.interrupt()
			.attr('class', null)
			.style('opacity', 1)
			.style('pointer-events', 'all')
			.selectAll('*')
			.remove();
	}

	/**
	 * Show a persistent full-canvas error overlay, covering the graph content. Does not clear
	 * itself automatically; call clear to dismiss it.
	 *
	 * @param graph - The graph instance to show the error overlay on
	 */
	static error(graph: GraphD3) {
		OverlayToolbox.clear(graph);

		graph.overlay
			.attr('class', 'error')
			.append('rect')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('fill', 'white');

		const text = graph.overlay.append('text');
		text
			.append('tspan')
			.text('Oops!')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('font-size', settings.OVERLAY_BIG_FONT)
			.attr('dominant-baseline', 'middle')
			.attr('text-anchor', 'middle')
			.attr('fill', 'white');

		text
			.append('tspan')
			.text('An error occured rendering this graph')
			.attr('x', '50%')
			.attr('y', '50%')
			.attr('dy', settings.OVERLAY_BIG_FONT)
			.attr('font-size', settings.OVERLAY_SMALL_FONT)
			.attr('dominant-baseline', 'middle')
			.attr('text-anchor', 'middle')
			.style('cursor', 'pointer')
			.attr('fill', 'white');
	}

	/**
	 * Show (or re-trigger) the "Shift + Scroll to zoom" hint overlay, offering a click target
	 * that permanently disables the wheel zoom lock for this graph instance. The overlay fades
	 * itself out and clears automatically after lingering for a moment; calling this again while
	 * it's already showing restarts that fade-out without re-creating the DOM.
	 *
	 * @param graph - The graph instance to show the hint overlay on
	 */
	static zoom(graph: GraphD3) {
		if (!graph.overlay.classed('zoom')) {
			OverlayToolbox.clear(graph);

			graph.overlay
				.attr('class', 'zoom')
				.append('rect')
				.attr('width', '100%')
				.attr('height', '100%')
				.attr('background-color', 'black')
				.style('opacity', settings.OVERLAY_OPACITY);

			const text = graph.overlay.append('text');
			text
				.append('tspan')
				.text('Shift + Scroll to zoom')
				.attr('x', '50%')
				.attr('y', '50%')
				.attr('font-size', settings.OVERLAY_BIG_FONT)
				.attr('dominant-baseline', 'middle')
				.attr('text-anchor', 'middle')
				.attr('fill', 'white');

			text
				.append('tspan')
				.text('disable this')
				.attr('x', '50%')
				.attr('y', '50%')
				.attr('dy', settings.OVERLAY_BIG_FONT)
				.attr('font-size', settings.OVERLAY_SMALL_FONT)
				.attr('text-decoration', 'underline')
				.attr('dominant-baseline', 'middle')
				.attr('text-anchor', 'middle')
				.style('cursor', 'pointer')
				.attr('fill', 'white')
				.on('click', () => {
					graph.zoom_lock = false;
					OverlayToolbox.clear(graph);
				});
		}

		graph.overlay
			.interrupt()
			.style('opacity', 1)
			.transition()
			.duration(settings.OVERLAY_FADE_OUT)
			.delay(settings.OVERLAY_LINGER)
			.style('opacity', 0)
			.on('end', () => {
				OverlayToolbox.clear(graph);
			});
	}
}
