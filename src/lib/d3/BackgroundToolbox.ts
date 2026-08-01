import * as settings from '$lib/settings';
import type { GraphD3 } from './GraphD3';

/**
 * Renders the graph canvas's background: the panning/zooming grid pattern used in the
 * domains/subjects views, and the three-column past/present/future table used in the lectures
 * view, along with switching the SVG's sizing behavior (fluid vs. fixed viewBox) between them.
 */
export class BackgroundToolbox {
	/**
	 * Register the grid line pattern used by the grid background, in the graph's `<defs>`, if it
	 * hasn't been added already. Safe to call multiple times.
	 *
	 * @param graph - The graph instance whose defs the pattern is added to
	 */
	static init(graph: GraphD3) {
		const pattern = graph.definitions.select('pattern#grid');
		if (!pattern.empty()) return;

		const grid = graph.definitions
			.append('pattern')
			.attr('id', 'grid')
			.attr('width', settings.GRID_UNIT)
			.attr('height', settings.GRID_UNIT)
			.attr('patternUnits', 'userSpaceOnUse');

		grid
			.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', settings.GRID_UNIT * settings.MAX_ZOOM)
			.attr('y2', 0)
			.attr('stroke', settings.GRID_COLOR);

		grid
			.append('line')
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', settings.GRID_UNIT * settings.MAX_ZOOM)
			.attr('stroke', settings.GRID_COLOR);
	}

	/**
	 * Remove the current background content and reset the SVG's sizing back to fluid (fill its
	 * container), undoing anything the lecture background's fixed viewBox set up.
	 *
	 * @param graph - The graph instance to clear the background of
	 */
	static clear(graph: GraphD3) {
		graph.background.attr('class', null).selectAll('*').remove();

		// Reset svg viewBox
		graph.svg
			.classed('h-full', true)
			.classed('w-full', true)
			.style('max-width', null)
			.style('margin', null)
			.attr('viewBox', null);
	}

	/**
	 * Render the three-column past/present/future lecture table background, sized to fit the
	 * currently focused lecture's largest column, and switch the SVG to a fixed viewBox sized to
	 * match so the table isn't stretched to fill the container.
	 *
	 * @param graph - The graph instance to render the lecture background for, using `graph.lecture`
	 */
	static lecture(graph: GraphD3) {
		BackgroundToolbox.clear(graph);

		// Calculate table dimensions
		const size = graph.lecture
			? Math.max(
					graph.lecture.past_nodes.length,
					graph.lecture.present_nodes.length,
					graph.lecture.future_nodes.length
				)
			: 0;

		const column_left = settings.STROKE_WIDTH / 2;
		const column_top =
			settings.STROKE_WIDTH / 2 + settings.LECTURE_HEADER_HEIGHT * settings.GRID_UNIT;

		const column_width = (2 * settings.LECTURE_PADDING + settings.NODE_WIDTH) * settings.GRID_UNIT;
		const column_height =
			(size * settings.NODE_HEIGHT + (size + 1) * settings.LECTURE_PADDING) * settings.GRID_UNIT;

		const outer_width = 3 * column_width + settings.STROKE_WIDTH;
		const outer_height =
			(settings.LECTURE_HEADER_HEIGHT +
				size * settings.NODE_HEIGHT +
				(size + 1) * settings.LECTURE_PADDING) *
				settings.GRID_UNIT +
			settings.STROKE_WIDTH;

		// Past subject colunm
		graph.background
			.append('text')
			.attr('x', (settings.STROKE_WIDTH + column_width) / 2)
			.attr('y', 0)
			.text('Past Topics')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.style('font-size', settings.LECTURE_FONT_SIZE);

		graph.background
			.append('rect')
			.attr('x', column_left)
			.attr('y', column_top)
			.attr('width', column_width)
			.attr('height', column_height)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black');

		// Present subject column
		graph.background
			.append('text')
			.attr('x', (settings.STROKE_WIDTH + 3 * column_width) / 2)
			.attr('y', 0)
			.text('This Lecture')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.style('font-size', settings.LECTURE_FONT_SIZE);

		graph.background
			.append('rect')
			.attr('x', column_left + column_width)
			.attr('y', column_top)
			.attr('width', column_width)
			.attr('height', column_height)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black');

		// Future subject column
		graph.background
			.append('text')
			.attr('x', (settings.STROKE_WIDTH + 5 * column_width) / 2)
			.attr('y', 0)
			.text('Future Topics')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.style('font-size', settings.LECTURE_FONT_SIZE);

		graph.background
			.append('rect')
			.attr('x', column_left + 2 * column_width)
			.attr('y', column_top)
			.attr('width', column_width)
			.attr('height', column_height)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black');

		// Configure svg to scale to the client size
		graph.svg
			.classed('h-full', false)
			.classed('w-full', false)
			.style('max-width', outer_width + 'px')
			.style('margin', settings.LECTURE_PADDING * settings.GRID_UNIT + 'px')
			.attr('viewBox', `0 0 ${outer_width} ${outer_height}`);

		graph.background.attr('class', 'lecture');
	}

	/**
	 * Render the panning/zooming grid background used in the domains and subjects views.
	 *
	 * @param graph - The graph instance to render the grid background for
	 */
	static grid(graph: GraphD3) {
		BackgroundToolbox.clear(graph);

		graph.background
			.attr('class', 'grid')
			.append('rect')
			.attr('fill', 'url(#grid)')
			.attr('width', '100%')
			.attr('height', '100%');
	}

	/**
	 * Reposition and rescale the grid pattern to follow the camera's current pan/zoom transform,
	 * fading the grid lines out as the graph zooms out.
	 *
	 * @param graph - The graph instance whose grid should follow the transform
	 * @param transform - The current zoom transform (x/y translation and k scale)
	 */
	static transformGrid(graph: GraphD3, transform: { x: number; y: number; k: number }) {
		graph.svg
			.select('#grid')
			.attr('x', transform.x)
			.attr('y', transform.y)
			.attr('width', settings.GRID_UNIT * transform.k)
			.attr('height', settings.GRID_UNIT * transform.k)
			.selectAll('line')
			.style('opacity', Math.min(1, transform.k));
	}
}
