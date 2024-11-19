
<script lang="ts">

	// Internal dependencies
	import { GraphSVG } from '$scripts/svg'
	import type { GraphController } from '$scripts/controllers'

	// Components
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Graph from '$components/Graph.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Exports
	export let graph: GraphController
	export let exit_button: boolean

	// Functions
	export function show() {
		graphSVG.view = 'domains'
		visible = true
	}

	export function hide() {
		visible = false
	}

	// Variables
	const graphSVG = new GraphSVG(graph, false)
	let visible = false

</script>


<!-- Markup -->


{#if visible}
	<div class="background" />
	<div class="tabular">
		<div class="tabs">
			<button
				class="tab"
				class:active={graphSVG.view === 'domains'}
				on:click={() => graphSVG.view = 'domains'}
			> Domains </button>

			<button
				class="tab"
				class:active={graphSVG.view === 'subjects'}
				on:click={() => graphSVG.view = 'subjects'}
			> Subjects </button>

			<button
				class="tab"
				class:active={graphSVG.view === 'lectures'}
				on:click={() => graphSVG.view = 'lectures'}
			> Lectures </button>

			<div class="toolbar">
				<Dropdown
					id="lecture"
					placeholder="Select lecture"
					bind:value={graphSVG.lecture}
					options={graph.lecture_options}
				/>

				<Button on:click={() => graphSVG.findGraph()}>
					Find Graph
				</Button>

				<button class="exit" on:click={hide}>
					<img src={plus_icon} alt="Exit icon" class="icon" />
				</button>
			</div>
		</div>

		 <Graph {graphSVG} />
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.background
		position: fixed
		z-index: 999
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		opacity: 0.25
		background-color: black

	.tabular
		position: fixed
		translate: 0 -50%
		z-index: 1000
		top: 50%
		left: 0

		width: calc( 100% - 2 * $tudelft-logo-width )
		max-width: $big-column
		margin: 0 $tudelft-logo-width
		box-sizing: content-box

		background: $white
		border: 1px solid $gray
		border-radius: $border-radius
		box-shadow: $shadow

		.tabs
			display: flex

			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.tab
				padding: ($card-thin-padding + $input-thin-padding) $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				&.active
					background: $white
					border-width: 0 1px 0 1px

					& ~ .tab
						border-width: 0 1px 1px 0


				&:first-child
					border-left: none !important

			.toolbar
				display: flex
				flex-flow: row nowrap
				align-items: center
				justify-content: flex-end
				gap: $form-small-gap

				flex: 1
				padding: 0 $card-thick-padding
				border-bottom: 1px solid $gray

				.exit
					display: flex
					align-items: center
					justify-content: center

					margin-left: 1rem
					overflow: hidden

					.icon
						width: $input-icon-size
						rotate: 45deg

						cursor: pointer
						filter: $purple-filter

					&:focus, .icon:hover
						scale: $scale-on-hover
						filter: $dark-purple-filter

				:global(.dropdown)
					max-width: 20rem
					margin-left: $form-medium-gap

</style>