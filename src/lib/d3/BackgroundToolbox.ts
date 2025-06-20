import * as settings from '$lib/settings';
import type { GraphD3 } from './GraphD3';

export class BackgroundToolbox {
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

	static grid(graph: GraphD3) {
		BackgroundToolbox.clear(graph);

		graph.background
			.attr('class', 'grid')
			.append('rect')
			.attr('fill', 'url(#grid)')
			.attr('width', '100%')
			.attr('height', '100%');
	}

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
