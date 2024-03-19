
<!-- Script -->

<script lang="ts">

	import { onMount } from 'svelte';
	import * as d3 from 'd3';

	const gridSize = 15;
	const gridColor = '#a4a4a4';

	onMount(() => {
		function updateGrid(event: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
			svg.select('#grid')
			   .attr('x', event.transform.x)
			   .attr('y', event.transform.y)
			   .attr('width', gridSize * event.transform.k)
			   .attr('height', gridSize * event.transform.k)
			   .selectAll('line')
				   .attr('opacity', Math.min(1, event.transform.k));
		}

		const svg = d3.select('.editor')
					  .append('svg')
					  .attr('width', '100%')
					  .attr('height', '100%');

		const content = svg.append('g')
		  				   .attr('id', 'content');

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
			 .attr('width', '100%')
			 .attr('height', '100%')
			 .attr('fill', 'url(#grid)');

		svg.call(
			d3.zoom<SVGSVGElement, unknown>()
			  .scaleExtent([0.5, 2])
			  .on('zoom', (event) => {
				  content.attr('transform', event.transform);
				  updateGrid(event);
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