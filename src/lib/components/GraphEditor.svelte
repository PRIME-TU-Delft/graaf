
<!-- Script -->

<script lang="ts">

	import { onMount } from 'svelte';
	import * as d3 from 'd3';

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

	const gridUnit = 10;
	const gridColor = '#a4a4a4';

	const nodeWidth = 16;
	const nodeHeight = 8;
	const nodeBorderWidth = 2;

	const verticeDistance = 0.75;

	onMount(() => {
		function getVertice(start: Node, end: Node): [number, number, number, number] {

			// Trust me bro

			// Half the width and height of the nodes
			const width  = nodeWidth  / 2 + verticeDistance;
			const height = nodeHeight / 2 + verticeDistance;

			// Center of the nodes
			const ax = start.x - verticeDistance + width;
			const ay = start.y - verticeDistance + height;
			const bx = end.x   - verticeDistance + width;
			const by = end.y   - verticeDistance + height;

			// Difference between the centers
			const dx = bx - ax;
			const dy = by - ay;

			// Bounds
			const posBound =  height / width * dx + ay;
			const negBound = -height / width * dx + ay;

			const sign = by > negBound ? -1 : 1;
			const vertQuad = by > posBound !== by > negBound;

			// Final vertice
			return [
				ax, ay,
				bx + sign * (vertQuad ? height * dx / dy : width),
				by + sign * (vertQuad ? height : width * dy / dx)
			];
		}

		function updateNode(element: SVGGElement, node: Node) {

			// Update node
			const group = d3.select<SVGGElement, Node>(element);
			group.select<SVGUseElement>('use')
				.attr('x', node.x * gridUnit)
				.attr('y', node.y * gridUnit);
			group.select<SVGTextElement>('text')
				.attr('x', node.x * gridUnit + nodeWidth * gridUnit / 2)
				.attr('y', node.y * gridUnit + nodeHeight * gridUnit / 2);

			// Update vertices
			content.selectAll<SVGLineElement, Node[]>('line')
				.filter((nodes: Node[]) => nodes.includes(node))
				.each(function(nodes: Node[]) {
					const [x1, y1, x2, y2] = getVertice(nodes[0], nodes[1]);
					d3.select(this)
						.attr('x1', x1 * gridUnit)
						.attr('y1', y1 * gridUnit)
						.attr('x2', x2 * gridUnit)
						.attr('y2', y2 * gridUnit);
				});
		}

		function updateGrid(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {

			// Redraw grid
			svg.select('#grid')
				.attr('x', event.transform.x)
				.attr('y', event.transform.y)
				.attr('width', gridUnit * event.transform.k)
				.attr('height', gridUnit * event.transform.k)
				.selectAll('line')
					.attr('opacity', Math.min(1, event.transform.k));
		}

		const palette: { [key: string]: { stroke: string, fill: string } } = {
			'confident-turquoise': { stroke: '#009da5', fill: '#ccebed' },
			'neutral-gray':        { stroke: '#91999f', fill: '#d6d6d6' },
			'prosperous-red':      { stroke: '#e6362a', fill: '#fad7d4' },
			'majestic-purple':     { stroke: '#ae5171', fill: '#efdce3' },
			'serious-brown':       { stroke: '#563d29', fill: '#d7cec7' },
			'powerful-pink':       { stroke: '#f87089', fill: '#fee2e7' },
			'energizing-orange':   { stroke: '#ff6c2f', fill: '#ffe2d5' },
			'electric-green':      { stroke: '#50d691', fill: '#dcf7e9' },
			'mysterious-blue':     { stroke: '#3255a4', fill: '#d6dded' },
			'sunny-yellow':        { stroke: '#f1c21b', fill: '#fff2cc' }
		};

		// --> SVG element <-- //

		const svg = d3.select('#editor')
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

		const definitions = svg.append('defs');

		// --> Node symbols <-- //

		const top    = nodeBorderWidth / 2;
		const right  = nodeWidth * gridUnit - nodeBorderWidth / 2;
		const bottom = nodeHeight * gridUnit - nodeBorderWidth / 2;
		const left   = nodeBorderWidth / 2;
		const hmid   = nodeWidth * gridUnit / 2;
		const vmid   = nodeHeight * gridUnit / 2;

		// Confident turquoise
		if (nodes.some(node => node.style === 'confident-turquoise')) {
			definitions.append('symbol')
				.attr('id', 'confident-turquoise')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['confident-turquoise'].fill)
					.attr('stroke', palette['confident-turquoise'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top}
						 L ${right} ${top}
						 L ${right} ${bottom}
						 L ${left} ${bottom}
						 Z
					`);
		}

		// Neutral gray
		if (nodes.some(node => node.style === 'neutral-gray')) {
			definitions.append('symbol')
				.attr('id', 'neutral-gray')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['neutral-gray'].fill)
					.attr('stroke', palette['neutral-gray'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top + gridUnit}
						 L ${hmid} ${top}
						 L ${right} ${top + gridUnit}
						 L ${right} ${bottom - gridUnit}
						 L ${hmid} ${bottom}
						 L ${left} ${bottom - gridUnit}
						 Z
					`);
		}

		// Prosperous red
		if (nodes.some(node => node.style === 'prosperous-red')) {
			definitions.append('symbol')
				.attr('id', 'prosperous-red')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['prosperous-red'].fill)
					.attr('stroke', palette['prosperous-red'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top}
						 L ${hmid} ${top + gridUnit}
						 L ${right} ${top}
						 L ${right} ${bottom}
						 L ${hmid} ${bottom - gridUnit}
						 L ${left} ${bottom}
						 Z
					`);
		}

		// Majestic purple
		if (nodes.some(node => node.style === 'majestic-purple')) {
			definitions.append('symbol')
				.attr('id', 'majestic-purple')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['majestic-purple'].fill)
					.attr('stroke', palette['majestic-purple'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left + gridUnit} ${top}
						 L ${right - gridUnit} ${top}
						 L ${right} ${vmid}
						 L ${right - gridUnit} ${bottom}
						 L ${left + gridUnit} ${bottom}
						 L ${left} ${vmid}
						 Z
					`);
		}

		// Serious brown
		if (nodes.some(node => node.style === 'serious-brown')) {
			definitions.append('symbol')
				.attr('id', 'serious-brown')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['serious-brown'].fill)
					.attr('stroke', palette['serious-brown'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top}
						 L ${right} ${top}
						 L ${right - gridUnit} ${vmid}
						 L ${right} ${bottom}
						 L ${left} ${bottom}
						 L ${left + gridUnit} ${vmid}
						 Z
					`);
		}

		// Powerful pink
		if (nodes.some(node => node.style === 'powerful-pink')) {
			definitions.append('symbol')
				.attr('id', 'powerful-pink')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['powerful-pink'].fill)
					.attr('stroke', palette['powerful-pink'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top + 2 * gridUnit}
						 L ${left + 2 * gridUnit} ${top}
						 L ${right - 2 * gridUnit} ${top}
						 L ${right} ${top + 2 * gridUnit}
						 L ${right} ${bottom - 2 * gridUnit}
						 L ${right - 2 * gridUnit} ${bottom}
						 L ${left + 2 * gridUnit} ${bottom}
						 L ${left} ${bottom - 2 * gridUnit}
						 Z
					`);
		}

		// Energizing orange
		if (nodes.some(node => node.style === 'energizing-orange')) {
			definitions.append('symbol')
				.attr('id', 'energizing-orange')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['energizing-orange'].fill)
					.attr('stroke', palette['energizing-orange'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top + gridUnit}
						 L ${left + gridUnit} ${top + gridUnit}
						 L ${left + gridUnit} ${top}
						 L ${right - gridUnit} ${top}
						 L ${right - gridUnit} ${top + gridUnit}
						 L ${right} ${top + gridUnit}
						 L ${right} ${bottom - gridUnit}
						 L ${right - gridUnit} ${bottom - gridUnit}
						 L ${right - gridUnit} ${bottom}
						 L ${left + gridUnit} ${bottom}
						 L ${left + gridUnit} ${bottom - gridUnit}
						 L ${left} ${bottom - gridUnit}
						 Z
					`);
		}

		// Electric green
		if (nodes.some(node => node.style === 'electric-green')) {
			definitions.append('symbol')
				.attr('id', 'electric-green')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['electric-green'].fill)
					.attr('stroke', palette['electric-green'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${bottom}
						 Q ${left + 2 * gridUnit} ${vmid} ${left} ${top}
						 L ${right} ${top}
						 Q ${right - 2 * gridUnit} ${vmid} ${right} ${bottom}
						 Z
					`);
		}

		// Mysterious blue
		if (nodes.some(node => node.style === 'mysterious-blue')) {
			definitions.append('symbol')
				.attr('id', 'mysterious-blue')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['mysterious-blue'].fill)
					.attr('stroke', palette['mysterious-blue'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left + gridUnit} ${bottom}
						 Q ${left - gridUnit} ${vmid} ${left + gridUnit} ${top}
						 L ${right - gridUnit} ${top}
						 Q ${right + gridUnit} ${vmid} ${right - gridUnit} ${bottom}
						 Z
					`);
		}

		// Sunny yellow
		if (nodes.some(node => node.style === 'sunny-yellow')) {
			definitions.append('symbol')
				.attr('id', 'sunny-yellow')
				.attr('width', nodeWidth * gridUnit)
				.attr('height', nodeHeight * gridUnit)
				.append('path')
					.attr('fill', palette['sunny-yellow'].fill)
					.attr('stroke', palette['sunny-yellow'].stroke)
					.attr('stroke-width', nodeBorderWidth)
					.attr('d',
						`M ${left} ${top + 2 * gridUnit}
						 A ${2 * gridUnit} ${2 * gridUnit} 0 0 1 ${left + 2 * gridUnit}  ${top}
						 L ${right - 2 * gridUnit} ${top}
						 A ${2 * gridUnit} ${2 * gridUnit} 0 0 1 ${right} ${top + 2 * gridUnit}
						 L ${right} ${bottom - 2 * gridUnit}
						 A ${2 * gridUnit} ${2 * gridUnit} 0 0 1 ${right - 2 * gridUnit} ${bottom}
						 L ${left + 2 * gridUnit} ${bottom}
						 A ${2 * gridUnit} ${2 * gridUnit} 0 0 1 ${left} ${bottom - 2 * gridUnit}
						 Z
					`);
		}

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
			.attr('width', gridUnit)
			.attr('height', gridUnit)
			.attr('patternUnits', 'userSpaceOnUse')

		pattern.append('line')
			.attr('stroke', gridColor)
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', gridUnit * 2)
			.attr('y2', 0);

		pattern.append('line')
			.attr('stroke', gridColor)
			.attr('x1', 0)
			.attr('y1', 0)
			.attr('x2', 0)
			.attr('y2', gridUnit * 2);

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
							event.subject.x = event.subject.x + event.dx / gridUnit;
							event.subject.y = event.subject.y + event.dy / gridUnit;
							updateNode(this, node);
						})
						.on('end', function(event, node) {
							event.subject.x = Math.round(event.subject.x);
							event.subject.y = Math.round(event.subject.y);
							updateNode(this, node);
						})
				)
				.each(function(node) {

					// Draw node
					const group = d3.select<SVGGElement, Node>(this);
					group.append('use')
						.attr('href', `#${node.style}`)
						.attr('x', node.x * gridUnit)
						.attr('y', node.y * gridUnit);
					group.append('text')
						.text(node.text)
						.attr('x', node.x * gridUnit + nodeWidth * gridUnit / 2)
						.attr('y', node.y * gridUnit + nodeHeight * gridUnit / 2)
						.attr('dominant-baseline', 'middle')
						.attr('text-anchor', 'middle');

					// Draw vertices
					const dependencies = nodes.filter(dependency => node.dependencies.includes(dependency.id));
					dependencies.forEach(dependency => {
						const [x1, y1, x2, y2] = getVertice(dependency, node);
						content.insert('line', ":first-child")
							.datum([dependency, node])
							.attr('x1', x1 * gridUnit)
							.attr('y1', y1 * gridUnit)
							.attr('x2', x2 * gridUnit)
							.attr('y2', y2 * gridUnit)
							.attr('stroke-width', 2)
							.attr('stroke', palette[dependency.style].stroke)
							.attr('fill', palette[dependency.style].stroke)
							.attr('marker-end', 'url(#arrowhead)');
						});
				   })
	});

</script>

<!-- Markup -->

<div id="editor" />

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	#editor
		width: 100%
		height: 600px

</style>