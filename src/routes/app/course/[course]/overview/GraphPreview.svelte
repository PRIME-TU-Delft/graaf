
<script lang="ts">

	// External dependencies
	import { onDestroy } from 'svelte'

	// Internal dependencies
	import { GraphSVG, SVGState } from '$scripts/svg'
	import { focusOnLoad, loopFocus } from '$scripts/actions/hocusfocus'
	import type { GraphController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Graph from '$components/Graph.svelte'

	// Functions
	function onkeydown(event: KeyboardEvent) {
		if (!visible) return

		if (event.key === 'Escape') {
			hide()
		}
	}

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

<svelte:window on:keydown={ onkeydown } />

{#if visible}
	<div class="background" />
	<div class="tabular" use:loopFocus={ updateUI }>
		<div class="tabs">
			<button
				tabindex="-1"
				class="tab"
				class:active={ graphSVG.view === 'lectures' }
				on:click={ () => graphSVG.view = 'lectures' } 
			> Lectures </button>

			<button
				tabindex="-1"
				class="tab"
				class:active={ graphSVG.view === 'subjects' }
				on:click={ () => graphSVG.view = 'subjects' }
			> Subjects </button>

			<button
				tabindex="-1"
				class="tab"
				class:active={ graphSVG.view === 'domains' }
				on:click={ () => graphSVG.view = 'domains' }
			> Domains </button>

			<div class="toolbar">
				<Dropdown
					placeholder="Select lecture"
					bind:value={ graphSVG.lecture }
					options={ graph.lecture_options }
				/>

				<Button
					disabled={ disable_graph_controls }
					on:click={ () => graphSVG.centerGraph() }
				> Center Graph </Button>

				<div class="flex-spacer" />

				<LinkButton href="/app/graph/{graph.id}/editor?type=layout&view={graphSVG.view}">
					Edit Layout
				</LinkButton>
				
				<button class="exit" on:click={ hide } use:focusOnLoad />
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
	@use "sass:math"

	.background
		position: fixed
		z-index: 3
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		opacity: 0.25
		background-color: black

	.tabular
		position: fixed
		translate: -50% -50%
		z-index: 4
		top: 50%
		left: 50%

		width: calc( 100% - 2 * $tudelft-logo-width )
		max-width: $big-column
		box-sizing: content-box

		background: $white
		border: 1px solid $gray
		border-radius: $default-border-radius
		box-shadow: $default-box-shadow

		.tabs
			display: flex

			width: 100%

			background: $light-gray
			border-radius: calc($default-border-radius - 1px) calc($default-border-radius - 1px) 0 0

			.tab
				padding: ($card-thin-padding + $input-thin-padding) $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($default-border-radius - 1px) calc($default-border-radius - 1px) 0 0

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

				:global(.dropdown)
					max-width: 20rem

				.exit
					position: relative

					min-width: $total-icon-size
					min-height: $total-icon-size
					padding: $input-icon-padding

					border-radius: $default-border-radius

					cursor: pointer

					&:focus-visible
						outline: $default-outline

					&:hover::before, &:hover::after
						height: $input-icon-size * math.sqrt(2)

					&::before, &::after
						content: ''

						position: absolute
						translate: -50% -50%
						rotate: 45deg
						left: 50%
						top: 50%

						height: $input-icon-size

						pointer-events: none
						border-left: 2px solid $dark-gray
						transition: height $default-transition

					&::after
						rotate: -45deg

		.content
			height: min(750px, calc(100vh - 2 * $tudelft-logo-width))

</style>