import * as d3 from 'd3';
import * as settings from './settings';

export function createGrid(element: SVGSVGElement) {
	const svg = d3.select<SVGSVGElement, unknown>(element);
	const definitions = svg.select('defs') || svg.append('defs');

	const pattern = definitions
		.append('pattern')
		.attr('patternUnits', 'userSpaceOnUse')
		.attr('width', settings.GRID_UNIT)
		.attr('height', settings.GRID_UNIT)
		.attr('id', 'grid');

	pattern
		.append('line')
		.attr('stroke', settings.GRID_COLOR)
		.attr('x1', 0)
		.attr('y1', 0)
		.attr('x2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM)
		.attr('y2', 0);

	pattern
		.append('line')
		.attr('stroke', settings.GRID_COLOR)
		.attr('x1', 0)
		.attr('y1', 0)
		.attr('x2', 0)
		.attr('y2', settings.GRID_UNIT * settings.GRID_MAX_ZOOM);

	svg
		.append('rect')
		.attr('fill', 'url(#grid)')
		.attr('width', '100%')
		.attr('height', '100%')
		.lower();
}
