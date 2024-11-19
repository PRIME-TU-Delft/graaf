
<script lang="ts">

	// Internal dependencies
	import type { GraphSVG } from '$scripts/svg'

	// Assets
	import zoom_out_icon from '$assets/zoom-out-icon.svg'
	import zoom_in_icon from '$assets/zoom-in-icon.svg'

	// Exports
	export let graphSVG: GraphSVG

</script>

<!-- Markup -->

<div class="graph">
	<svg use:graphSVG.attach />

	{#if graphSVG.interactive}
		<div class="zoom">
			<button on:click={() => graphSVG.zoomIn()}><img src={zoom_in_icon} alt="Zoom in"></button>
			<button on:click={() => graphSVG.zoomOut()}><img src={zoom_out_icon} alt="Zoom out"></button>
		</div>
	{/if}
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.graph
		position: relative
		width: 100%
		height: 100%

		svg
			display: block
			height: 100%
			width: 100%

		.zoom
			position: absolute
			bottom: 0
			right: 0

			display: flex
			flex-flow: column nowrap
			padding: $card-thin-padding

			button
				box-sizing: content-box

				width: 1.75rem
				height: 1.75rem
				padding: $input-icon-padding

				cursor: pointer

				img
					width: 100%
					height: 100%

					transform-origin: center
					pointer-events: none

				&:hover img
					scale: $scale-on-hover
</style>
