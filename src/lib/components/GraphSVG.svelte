
<script lang="ts">


	// Internal imports
	import { GraphSVG, View } from '$scripts/d3'
	import { graph } from '$stores'
	
	// Components
	import Dropdown from './Dropdown.svelte'

	// Assets
	import zoomInIcon from '$assets/zoom-in-icon.svg'
	import zoomOutIcon from '$assets/zoom-out-icon.svg'

	// Exports
	export let interactive = true
	export const controller = new GraphSVG($graph, interactive)

</script>


<!-- Markup -->


<div class="tabular">
    <div class="tabs">
        <button
			class="tab first"
            class:active={controller.view === View.domains}
            on:click={() => controller.view = View.domains}
        > Domains </button>

        <button
			class="tab"
            class:active={controller.view === View.subjects}
            on:click={() => controller.view = View.subjects}
        > Subjects </button>

        <button
			class="tab last"
            class:active={controller.view === View.lectures}
            on:click={() => controller.view = View.lectures}
        > Lectures </button>

		<Dropdown label="Lecture" placeholder="Choose a Lecture" options={$graph.lecture_options} bind:value={controller.lecture} />
    </div>

	<svg use:controller.attach />

	{#if interactive}
		<div class="controls">
			<button on:click={() => controller.zoomIn()}><img src={zoomInIcon} alt=""></button>
			<button on:click={() => controller.zoomOut()}><img src={zoomOutIcon} alt=""></button>
		</div>
	{/if}
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		display: flex
		flex-flow: column nowrap
		position: relative

		height: 100%

		border-radius: $border-radius
		border: 1px solid $gray

		svg
			width: 100%
			height: 100%

		.controls
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
		
		.tabs
			display: flex
			flex-flow: row nowrap
			align-items: center

			position: relative

			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0
			border-bottom: 1px solid $gray

			.tab
				position: relative

				padding: $card-thin-padding $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 0 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				text-align: left

				&.active
					margin-bottom: -1px

					background: $white
					border-bottom-color: $white
					border-width: 0 1px 1px 1px

					& ~ .tab
						border-width: 0 1px 0 0

				&.first
					border-left: none !important
				
				&.last
					margin-right: auto

			:global(.dropdown)	
				max-width: 20rem
				margin: 0 $card-thick-padding 0 $card-thick-padding

</style>