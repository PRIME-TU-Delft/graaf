
<script lang="ts">


	// Lib imports
    import { Graph } from '$scripts/entities'
	import { GraphSVG, View } from '$scripts/d3'
	
	// Components
	import Dropdown from './Dropdown.svelte';

	// Exports
	export let graph: Graph
	export let interactive: boolean = true
	export function findGraph() { graphSVG.findGraph() }
	export function toggleForces() { }

	// Variables
	let graphSVG: GraphSVG = new GraphSVG(graph, interactive)

</script>


<!-- Markup -->


<div class="tabular">
    <div class="tabs">
        <button
			class="tab first"
            class:active={graphSVG.view === View.domains}
            on:click={() => graphSVG.view = View.domains}
        > Domains </button>

        <button
			class="tab"
            class:active={graphSVG.view === View.subjects}
            on:click={() => graphSVG.view = View.subjects}
        > Subjects </button>

        <button
			class="tab last"
            class:active={graphSVG.view === View.lectures}
            on:click={() => graphSVG.view = View.lectures}
        > Lectures </button>

		<Dropdown label="Lecture" placeholder="Choose a Lecture" bind:value={graphSVG.lecture} options={graph.lecture_options} />
    </div>

	<svg use:graphSVG.create />
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		display: flex
		flex-flow: column nowrap

		height: 100%

		border-radius: $border-radius
		border: 1px solid $gray

		svg
			width: 100%
			height: 100%
		
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