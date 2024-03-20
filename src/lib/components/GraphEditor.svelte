
<!-- Script -->

<script lang="ts">

	import { onMount } from 'svelte';
	import * as d3 from 'd3';
	import { xor } from '$scripts/xor';

	class Node {
		id: number;
		x: number;
		y: number;
		color: string;
		text: string;
		dependencies: number[];

		constructor(id:number, x: number, y: number, color: string, text: string, dependencies: number[]) {
			this.id = id;
			this.x = x;
			this.y = y;
			this.color = color;
			this.text = text;
			this.dependencies = dependencies;
		}
	}

	const colorMap: { [key: string]: { stroke: string, fill: string } } = {
		red: { stroke: '#ff0000', fill: '#ff9999'},
		green: { stroke: '#00ff00', fill: '#99ff99'},
		blue: { stroke: '#0000ff', fill: '#9999ff'}
	};

	const nodes = [
		new Node(0, 0, 20,  'red',   'Node 1', []),
		new Node(1, 30, 0,  'green', 'Node 2', [0]),
		new Node(2, 30, 40, 'blue',  'Node 3', [0, 1])
	];

	const gridColor = '#a4a4a4';
	const gridSize = 10;

	const nodeWidth = 16;
	const nodeHeight = 8;
	const nodeBorderWidth = 2;

	onMount(() => {
		function getVertice(start: Node, end: Node): [number, number, number, number] {

			// Half the width and height of the nodes
			const width  = nodeWidth  / 2;
			const height = nodeHeight / 2;

			// Center of the nodes
			const ax = start.x + width;
			const ay = start.y + height;
			const bx = end.x   + width;
			const by = end.y   + height;

			// Difference between the centers
			const dx = bx - ax;
			const dy = by - ay;

			// Bounds
			const posBound =  height / width * dx + ay;
			const negBound = -height / width * dx + ay;

			const sign = by > negBound ? -1 : 1;
			const vertQuad = xor(by > posBound, by > negBound);

			// Final vertice
			return [
				ax, ay, 
				bx + sign * (vertQuad ? height * dx / dy : width), 
				by + sign * (vertQuad ? height : width * dy / dx)
			];
		}

		function updateNode(element: SVGRectElement) {

			// Redraw rectangle
			const rect = d3.select<SVGRectElement, Node>(element);
			rect.attr('x', node => (node.x * gridSize) + nodeBorderWidth / 2)
				.attr('y', node => (node.y * gridSize) + nodeBorderWidth / 2);

			// Redraw vertices
			content.selectAll<SVGLineElement, Node[]>('line')
				   .filter((nodes: Node[]) => nodes.includes(rect.datum()))
				   .each(function(nodes: Node[]) {
						const [x1, y1, x2, y2] = getVertice(nodes[0], nodes[1]);
						d3.select(this)
						  .attr('x1', x1 * gridSize)
						  .attr('y1', y1 * gridSize)
						  .attr('x2', x2 * gridSize)
						  .attr('y2', y2 * gridSize);
				   });
		}

		function updateGrid(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {

			// Redraw grid
			svg.select('#grid')
			   .attr('x', event.transform.x)
			   .attr('y', event.transform.y)
			   .attr('width', gridSize * event.transform.k)
			   .attr('height', gridSize * event.transform.k)
			   .selectAll('line')
				   .attr('opacity', Math.min(1, event.transform.k));
		}

		// Main SVG element
		const svg = d3.select('.editor')
					  .append('svg')
						  .attr('width', '100%')
						  .attr('height', '100%')
						  .call(
						  	  d3.zoom<SVGSVGElement, unknown>()
						  		.scaleExtent([0.5, 2])
						  		.on('zoom', (event) => {
						  			content.attr('transform', event.transform);
						  			updateGrid(event);
						  		})
						  );

		// Grid pattern
		const pattern = svg.append('pattern')
							   .attr('id', 'grid')
							   .attr('patternUnits', 'userSpaceOnUse')
							   .attr('x', 0)
							   .attr('y', 0)
							   .attr('width', gridSize)
							   .attr('height', gridSize)

		pattern.append('line')
				   .attr('stroke', gridColor)
				   .attr('x1', 0)
				   .attr('y1', 0)
				   .attr('x2', gridSize * 2)
				   .attr('y2', 0);

		pattern.append('line')
				   .attr('stroke', gridColor)
				   .attr('x1', 0)
				   .attr('y1', 0)
				   .attr('x2', 0)
				   .attr('y2', gridSize * 2);

		svg.append('rect')
			   .attr('id', 'background')
			   .attr('width', '100%')
			   .attr('height', '100%')
			   .attr('fill', 'url(#grid)');

		// Content
		const content = svg.append('g');
		content.selectAll('rect')		 // Create a selection of rectangles
			   .data(nodes)				 // Bind the data to the selection
			   .enter()					 // For each data point that doesn't have a corresponding rectangle
			   .append('rect')			 // Create a new rectangle
				   .attr('x', node => node.x * gridSize + nodeBorderWidth / 2)
				   .attr('y', node => node.y * gridSize + nodeBorderWidth / 2)
				   .attr('width',  nodeWidth  * gridSize - nodeBorderWidth)
				   .attr('height', nodeHeight * gridSize - nodeBorderWidth)
				   .attr('fill',   node => colorMap[node.color].fill)
				   .attr('stroke', node => colorMap[node.color].stroke)
				   .attr('stroke-width', nodeBorderWidth)
				   .each(function(node) {

						// Draw vertices
						const dependencies = nodes.filter(dependency => node.dependencies.includes(dependency.id));
						dependencies.forEach(dependency => {
							const [x1, y1, x2, y2] = getVertice(dependency, node);
							content.insert('line', ":first-child")
									   .datum([dependency, node])
									   .attr('x1', x1 * gridSize)
									   .attr('y1', y1 * gridSize)
									   .attr('x2', x2 * gridSize)
									   .attr('y2', y2 * gridSize)
									   .attr('stroke', colorMap[dependency.color].stroke)
									   .attr('stroke-width', 2);
						});
				   })
				   .call(
						d3.drag<SVGRectElement, Node>()
							.on('drag', function(event, node) {
								event.subject.x = event.subject.x + event.dx / gridSize;
								event.subject.y = event.subject.y + event.dy / gridSize;
								updateNode(this);								
							})
							.on('end', function(event, node) {
								event.subject.x = Math.round(event.subject.x);
								event.subject.y = Math.round(event.subject.y);
								updateNode(this);								
							})
				   );
	});

</script>

<!-- Markup -->

<div class="editor" />

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		width: 100%
		height: 600px

</style>