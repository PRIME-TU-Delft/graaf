
<script lang="ts">

	// External dependencies
	import { onDestroy } from 'svelte'

	// Internal dependencies
	import { GraphSVG, SVGState } from '$scripts/svg'
	import type { GraphController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Graph from '$components/Graph.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Functions
	export function show() {
		graphSVG.view = 'subjects'
		visible = true
	}

	export function hide() {
		visible = false
	}

	function updateUI() {
		disable_graph_controls = graphSVG.view === 'lectures' || graphSVG.state === SVGState.broken
	}

	// Main
	export let graph: GraphController

	const graphSVG = new GraphSVG(graph, false)
	graphSVG.subscribe(updateUI)

	let disable_graph_controls = false
	let visible = false

	onDestroy(() => {
		graphSVG.unsubscribe(updateUI)
	})

</script>

<!-- Markup -->

{#if visible}
	<div class="background" />
	<div class="tabular">
		<div class="tabs">
			<button
				class="tab"
				class:active={graphSVG.view === 'lectures'}
				on:click={() => graphSVG.view = 'lectures'}
			> Lectures </button>

			<button
				class="tab"
				class:active={graphSVG.view === 'subjects'}
				on:click={() => graphSVG.view = 'subjects'}
			> Subjects </button>

			<button
				class="tab"
				class:active={graphSVG.view === 'domains'}
				on:click={() => graphSVG.view = 'domains'}
			> Domains </button>

			<div class="toolbar">
				<LinkButton href="/app/graph/{graph.id}/editor?type=layout&view={graphSVG.view}">
					Edit Layout
				</LinkButton>

				<Dropdown
					id="lecture"
					placeholder="Select lecture"
					bind:value={graphSVG.lecture}
					options={graph.lecture_options}
				/>

				<Button
					disabled={disable_graph_controls}
					on:click={() => graphSVG.centerGraph()}
				> Center Graph </Button>

				<button class="exit" on:click={hide}>
					<img src={plus_icon} alt="Exit icon" class="icon" />
				</button>
			</div>
		</div>

		<div class="content">
			<Graph {graphSVG} />
		</div>
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
		translate: -50% -50%
		z-index: 1000
		top: 50%
		left: 50%

		width: calc( 100% - 2 * $tudelft-logo-width )
		max-width: $big-column
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

				&:not(.active)
					cursor: pointer

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

		.content
			height: min(750px, calc(100vh - 2 * $tudelft-logo-width))

</style>