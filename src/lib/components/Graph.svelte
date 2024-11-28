
<script lang="ts">

	// Internal dependencies
	import type { GraphSVG } from '$scripts/svg'

	// Assets
	import zoom_out_icon from '$assets/zoom-out-icon.svg'
	import zoom_in_icon from '$assets/zoom-in-icon.svg'

	// Main
	export let graphSVG: GraphSVG

	let show_legend = false

</script>

<!-- Markup -->

<div class="graph">
	<svg use:graphSVG.attach />

	<button class="legend" class:show={show_legend} on:click={ () => show_legend = !show_legend }>
		<h4 class="title"> Domain Legend </h4>
		{#if show_legend}
			{#each graphSVG.graph.domains as domain}
				<span> {domain.name} <div class="preview" style:background={domain.color}/> </span>
			{/each}
		{/if}
	</button>

	<div class="zoom">
		<button on:click={() => graphSVG.zoomIn()}><img src={zoom_in_icon} alt="Zoom in"></button>
		<button on:click={() => graphSVG.zoomOut()}><img src={zoom_out_icon} alt="Zoom out"></button>
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use "sass:math"
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

		.legend
			position: absolute
			top: $card-thin-padding
			right: $card-thin-padding

			display: flex
			flex-flow: column nowrap
			padding: $card-thin-padding
			align-items: flex-end

			background: $white
			border: 1px solid $gray
			border-radius: $border-radius

			cursor: pointer

			$dropdown-icon-size: 0.75rem

			& > *
				pointer-events: none

			&::after
				content: ''

				position: absolute
				translate: -50% -50%
				rotate: 45deg
				top: 0.75rem + $card-thin-padding + math.div($dropdown-icon-size, 4)
				right: $card-thin-padding

				width: math.div($dropdown-icon-size, math.sqrt(2))
				height: math.div($dropdown-icon-size, math.sqrt(2))

				border: 1px solid $dark-gray
				border-width: 1px 0 0 1px
			
			&.show::after
				top: 0.75rem + $card-thin-padding - math.div($dropdown-icon-size, 4)
				border-width: 0 1px 1px 0

			.title
				padding-right: $card-thin-padding + 1rem

			span
				display: flex
				flex-flow: row nowrap
				align-items: center

				color: $dark-gray

				.preview
					width: 1rem
					height: 1rem
					margin-left: $form-small-gap

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
