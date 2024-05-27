
<script lang="ts">


	// Lib imports
    import { Graph } from '$scripts/graph/entities'
	import { GraphSVG, GraphType } from '$scripts/graph/graphSVG'
	
	// Components
	import Dropdown from './Dropdown.svelte';

	// Exports
	export let graph: Graph
	export let interactive: boolean = true

	// Variables
	let graphSVG: GraphSVG = new GraphSVG(graph, GraphType.domains, interactive)
	graphSVG.lecture = graph.lectures[0]

	$: lectureOptions = graph.lectures
		.filter(lecture => lecture.name)
		.map(lecture => ({name: lecture.name!, value: lecture}))

</script>



<!-- Markup -->



<div class="tabular">
    <div class="tabs">
        <button
			class="tab first"
            class:active={graphSVG.type === GraphType.domains}
            on:click={() => graphSVG.type = GraphType.domains}
        > Domains </button>

        <button
			class="tab"
            class:active={graphSVG.type === GraphType.subjects}
            on:click={() => graphSVG.type = GraphType.subjects}
        > Subjects </button>

        <button
			class="tab last"
            class:active={graphSVG.type === GraphType.lecture}
            on:click={() => graphSVG.type = GraphType.lecture}
        > Lectures </button>

		<Dropdown label="Lecture" placeholder="Choose a Lecture" bind:value={graphSVG.lecture} options={lectureOptions} />
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