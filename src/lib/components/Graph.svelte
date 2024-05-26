
<script lang="ts">


	// Lib imports
    import { Graph } from '$scripts/graph/entities'
	import { GraphSVG, GraphType } from '$scripts/graph/graphSVG'

	// Exports
	export let graph: Graph

	// Variables
	let graphSVG: GraphSVG = new GraphSVG(graph, GraphType.domains, true)
	graphSVG.lecture = graph.lectures[0]

</script>



<!-- Markup -->



<div class="tabular">
    <div class="tabs">
        <button
            class:active={graphSVG.type === GraphType.domains}
            on:click={() => graphSVG.type = GraphType.domains}
        > Domains </button>

        <button
            class:active={graphSVG.type === GraphType.subjects}
            on:click={() => graphSVG.type = GraphType.subjects}
        > Subjects </button>

        <button
            class:active={graphSVG.type === GraphType.lecture}
            on:click={() => graphSVG.type = GraphType.lecture}
        > Lectures </button>

        <div class="dynamic-border" />
    </div>

    <div class="editor">
        <svg use:graphSVG.create />
    </div>
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		display: flex
		align-items: center 
		justify-content: center

		height: 650px


	.tabular
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			flex-flow: row nowrap

			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.dynamic-border
				flex: 1
				border-bottom: 1px solid $gray

			button
				display: block
				margin: 0
				padding: $card-thin-padding $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				text-align: left

				&.active
					background: $white
					border-width: 0 1px 0 1px

					& ~ button
						border-width: 0 1px 1px 0

				&:first-child
					border-left: none !important

</style>