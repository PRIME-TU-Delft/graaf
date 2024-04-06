
<!-- Script -->

<script lang="ts">

	import * as d3 from 'd3';
	import { onMount } from 'svelte';

	import * as settings from './settings';

	onMount(() => {
		function zoomGraph(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {

			// Update content
			content.attr('transform', event.transform); // TODO this raises an error, but still works <3

			// Update grid
			svg.select('#grid')
				.attr('x', event.transform.x)
				.attr('y', event.transform.y)
				.attr('width', settings.GRID_UNIT * event.transform.k)
				.attr('height', settings.GRID_UNIT * event.transform.k)
				.selectAll('line')
					.attr('opacity', Math.min(1, event.transform.k));
		}

		function dragNode(element: SVGGElement, node: Node) {

			// Update node
			const group = d3.select<SVGGElement, Node>(element);
			group.select<SVGUseElement>('path')
				.attr('transform', `translate(${node.x * settings.GRID_UNIT}, ${node.y * settings.GRID_UNIT})`);
			group.select<SVGTextElement>('text')
				.attr('transform',
					  `translate(
						${node.x * settings.GRID_UNIT + settings.NODE_WIDTH * settings.GRID_UNIT / 2},
						${node.y * settings.GRID_UNIT + settings.NODE_HEIGHT * settings.GRID_UNIT / 2})
					  `);

			// Update vertices
			content.selectAll<SVGLineElement, Node[]>('line')
				.filter((nodes: Node[]) => nodes.includes(node))
				.each(function(nodes: Node[]) {
					const [x1, y1, x2, y2] = calcVertice(nodes[0], nodes[1]);
		 			d3.select(this)
						.attr('x1', x1 * settings.GRID_UNIT)
						.attr('y1', y1 * settings.GRID_UNIT)
						.attr('x2', x2 * settings.GRID_UNIT)
						.attr('y2', y2 * settings.GRID_UNIT);
				});
		}

		function calcVertice(start: Node, end: Node): [number, number, number, number] {

			/* We are calculating the vertice connecting two nodes.
			 * It should start at the center of the start node and end at the BOUNDS of the end node.
			 * We first find some properties of the nodes: their size, center, and the difference between them.
			 * As the calculation of the vertice depends on the placement of the start node relative to the end node,
			 * we split the plane in 4 quadrants, originating from the start node, following its diagonals.
			 * We then use simple geometry, based on the quadrant the end node resides in, to calculate the bounds of the end node.
			 * The final vertice is a line from the center of the start node to the calculated bounds of the end node.
			 */

			// Half the width and height of the nodes
			const width  = settings.NODE_WIDTH  / 2 + settings.NODE_MARGIN;
			const height = settings.NODE_HEIGHT / 2 + settings.NODE_MARGIN;

			// Center of the nodes
			const ax = start.x - settings.NODE_MARGIN + width;
			const ay = start.y - settings.NODE_MARGIN + height;
			const bx = end.x   - settings.NODE_MARGIN + width;
			const by = end.y   - settings.NODE_MARGIN + height;

			// Difference between the centers
			const dx = bx - ax;
			const dy = by - ay;

			// Bounds
			const posBound =  height / width * dx + ay;
			const negBound = -height / width * dx + ay;

			const sign = by > negBound ? -1 : 1;
			const vertQuad = (by > posBound) == (by > negBound);

			// Final vertice
			return [
				ax, ay,
				bx + sign * (vertQuad ? height * dx / dy : width),
				by + sign * (vertQuad ? height : width * dy / dx)
			];
		}

		// --> SVG element <-- //

		const svg = d3.select<SVGSVGElement, unknown>('#graph')
						.call(
							  d3.zoom<SVGSVGElement, unknown>()
								.scaleExtent([settings.GRID_MIN_ZOOM, settings.GRID_MAX_ZOOM])
								.on('zoom', (event) => {
									zoomGraph(event);
								})
						);

		// --> Definitions <-- //

		const definitions = svg.append('defs');

		// --> Markers <-- //

		definitions.append('marker')
			.attr('id', 'arrowhead')
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 5)
			.attr('refY', 5)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto-start-reverse')
			.append('path')
				.attr('fill', 'context-fill')
				.attr('d',
					  `M 0 0
					   L 10 5
					   L 0 10
					   Z
					  `);
		// --> Grid pattern <-- //

		const pattern = definitions.append('pattern')
			.attr('id', 'grid')
			.attr('width', settings.GRID_UNIT)
			.attr('height', settings.GRID_UNIT)
			.attr('patternUnits', 'userSpaceOnUse')

		pattern.append('line')
			.attr('stroke', settings.GRID_COLOR)
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', settings.GRID_UNIT * 2)
			.attr('y2', 0);

		pattern.append('line')
			.attr('stroke', settings.GRID_COLOR)
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', settings.GRID_UNIT * 2);

		svg.append('rect')
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('fill', 'url(#grid)');

		// --> Content <-- //

		const content = svg.append('g');
		content.selectAll('use')
			.data(nodes)
			.enter()
			.append('g')
				.call(
					d3.drag<SVGGElement, Node>()
						.on('drag', function(event, node) {
							event.subject.x = event.subject.x + event.dx / settings.GRID_UNIT;
							event.subject.y = event.subject.y + event.dy / settings.GRID_UNIT;
							dragNode(this, node);
						})
						.on('end', function(event, node) {
							event.subject.x = Math.round(event.subject.x);
							event.subject.y = Math.round(event.subject.y);
							dragNode(this, node);
						})
				)
				.each(function(node) {

					// Draw node
					const group = d3.select<SVGGElement, Node>(this);

					group.append('path')
						.attr('transform', `translate(${node.x * settings.GRID_UNIT}, ${node.y * settings.GRID_UNIT})`)
						.attr('fill', settings.styles[node.style].fill)
						.attr('stroke', settings.styles[node.style].stroke)
						.attr('stroke-width', settings.STROKE_WIDTH)
						.attr('d', settings.styles[node.style].path);

					group.append('text')
						.text(node.text)
						.attr('dominant-baseline', 'middle')
						.attr('text-anchor', 'middle')
						.attr('transform',
							  `translate(
								${node.x * settings.GRID_UNIT + settings.NODE_WIDTH * settings.GRID_UNIT / 2},
								${node.y * settings.GRID_UNIT + settings.NODE_HEIGHT * settings.GRID_UNIT / 2})
							  `);

					// Draw vertices
					const dependencies = nodes.filter(dependency => node.dependencies.includes(dependency.id));
					dependencies.forEach(dependency => {
						const [x1, y1, x2, y2] = calcVertice(dependency, node);
						content.insert('line', ':first-child')
							.datum([dependency, node])
							.attr('x1', x1 * settings.GRID_UNIT)
							.attr('y1', y1 * settings.GRID_UNIT)
							.attr('x2', x2 * settings.GRID_UNIT)
							.attr('y2', y2 * settings.GRID_UNIT)
							.attr('fill', settings.styles[dependency.style].stroke)
							.attr('stroke', settings.styles[dependency.style].stroke)
							.attr('stroke-width', settings.STROKE_WIDTH)
							.attr('marker-end', 'url(#arrowhead)');
					});
				})
	});

	// TODO EVERYTHING UNDER THIS LINE IS TEMPORARY

	class Node {
		id: number;
		x: number;
		y: number;
		style: string;
		text: string;
		dependencies: number[];

		constructor(id:number, x: number, y: number, color: string, text: string, dependencies: number[]) {
			this.id = id;
			this.x = x;
			this.y = y;
			this.style = color;
			this.text = text;
			this.dependencies = dependencies;
		}
	}

	const nodes = [
		new Node(0, 0, 20,  'prosperous-red',   'Node 1', []),
		new Node(1, 30, 0,  'electric-green', 'Node 2', [0]),
		new Node(2, 30, 40, 'mysterious-blue',  'Node 3', [0, 1])
	];

</script>

<!-- Markup -->

<svg id="graph" />

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	#graph
		display: block
		width: 100%
		height: 600px

</style>