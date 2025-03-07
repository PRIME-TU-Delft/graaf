import * as settings from '$lib/settings';
import { GraphD3 } from './GraphD3';

export { BackgroundToolbox };

// -----------------------------> Classes

class BackgroundToolbox {
	static init(graph: GraphD3) {
		const pattern = graph.definitions.select('pattern#grid');
		if (!pattern.empty()) {
			return;
		}

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
	}

	static lecture(graph: GraphD3) {
		BackgroundToolbox.clear(graph);

		graph.background.attr('class', 'lecture');

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
			(size * settings.NODE_HEIGHT +
				(size + 1) * settings.LECTURE_PADDING +
				settings.LECTURE_HEADER_HEIGHT) *
				settings.GRID_UNIT +
			settings.STROKE_WIDTH;

		// Note: if the background is bigger than the client, this will overflow
		// TODO scale the background/content when overflowing
		const dx = (graph.svg.node()!.clientWidth - outer_width) / 2;
		const dy = (graph.svg.node()!.clientHeight - outer_height) / 2;

		// Past subject colunm
		graph.background
			.append('text')
			.attr('x', dx + (settings.STROKE_WIDTH + column_width) / 2)
			.attr('y', dy)
			.text('Past Topics')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.style('font-size', settings.LECTURE_FONT_SIZE);

		graph.background
			.append('rect')
			.attr('x', dx + column_left)
			.attr('y', dy + column_top)
			.attr('width', column_width)
			.attr('height', column_height)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black');

		// Present subject column
		graph.background
			.append('text')
			.attr('x', dx + (settings.STROKE_WIDTH + 3 * column_width) / 2)
			.attr('y', dy)
			.text('This Lecture')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.style('font-size', settings.LECTURE_FONT_SIZE);

		graph.background
			.append('rect')
			.attr('x', dx + column_left + column_width)
			.attr('y', dy + column_top)
			.attr('width', column_width)
			.attr('height', column_height)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black');

		// Future subject column
		graph.background
			.append('text')
			.attr('x', dx + (settings.STROKE_WIDTH + 5 * column_width) / 2)
			.attr('y', dy)
			.text('Future Topics')
			.attr('text-anchor', 'middle')
			.attr('dominant-baseline', 'hanging')
			.style('font-size', settings.LECTURE_FONT_SIZE);

		graph.background
			.append('rect')
			.attr('x', dx + column_left + 2 * column_width)
			.attr('y', dy + column_top)
			.attr('width', column_width)
			.attr('height', column_height)
			.attr('stroke-width', settings.STROKE_WIDTH)
			.attr('fill', 'transparent')
			.attr('stroke', 'black');
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
