
<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { onDestroy } from 'svelte'

	// Internal dependencies
	import { graph, save_status } from './stores'
	import { GraphSVG, SVGState } from '$scripts/svg'

	import {
		validEditorType,
		validEditorView
	} from '$scripts/types'

	import type {
		EditorType,
		EditorView
	} from '$scripts/types'

	// Components
	import DomainTab from './DomainTab.svelte'
	import DomainHeader from './DomainHeader.svelte'
	import SubjectTab from './SubjectTab.svelte'
	import SubjectHeader from './SubjectHeader.svelte'
	import LectureTab from './LectureTab.svelte'
	import LectureHeader from './LectureHeader.svelte'

	import SimpleModal from '$components/SimpleModal.svelte'
	import SaveStatus from '$components/SaveStatus.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Graph from '$components/Graph.svelte'

	// Assets
	import info_icon from '$assets/info-icon.svg'

	// Functions
	function navigateEditor(type: EditorType, view: EditorView) {
		if (graphSVG.state === SVGState.animating) return

		editor_view = view
		editor_type = type

		search_params.set('type', editor_type)
		search_params.set('view', editor_view)
		goto(`?${search_params.toString()}`, { replaceState: true })

		graphSVG.view = view
	}

	function updateUI() {
		disable_graph_controls = graphSVG.view === 'lectures' || graphSVG.state === SVGState.broken
	}

	// Initialization
	const search_params = $page.url.searchParams
	const graphSVG = new GraphSVG($graph)

	let editor_type = search_params.get('type') as EditorType
	let editor_view = search_params.get('view') as EditorView
	let disable_graph_controls = false

	let autolayout_modal: SimpleModal

	graphSVG.subscribe(updateUI)

	navigateEditor(
		validEditorType(editor_type) ? editor_type : 'data',
		validEditorView(editor_view) ? editor_view : 'domains'
	)

	onDestroy(() => {
		graphSVG.unsubscribe(updateUI)
	})

</script>

<!-- Markup -->

<SimpleModal bind:this={autolayout_modal}>
	<h3 slot="header"> Autolayout </h3>
	Are you certain you want to start the autolayout process? This will irreversibly rearrange all nodes and relations in the graph.

	<div class="infobox">
		<div class="sidebar">
			<img src={info_icon} alt="">
		</div>
		<div class="content">
			During autolayout, your graph will become <b>force directed</b>. This means that nodes will be <b>attracted</b> to their parents and children, and <b>repelled</b> by other nodes.
			<b>Unlocked</b> nodes are subject to these forces, and have a dashed outline. Click or drag a node to <b>lock</b> it in place.
		</div>
	</div>

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => autolayout_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={() => {
				graphSVG.toggleAutolayout()
				autolayout_modal.hide()
			}}
		> Start Autolayout </Button>
	</svelte:fragment>
</SimpleModal>

<div class="tabular">
	<div class="sticky" id="sticky-tabular-header">
		<SaveStatus bind:this={ $save_status } />

		<div class="tabs">
			<button
				class="tab"
				class:active={editor_view === 'domains'}
				on:click={() => navigateEditor(editor_type, 'domains')}
			> Domains </button>

			<button
				class="tab"
				class:active={editor_view === 'subjects'}
				on:click={() => navigateEditor(editor_type, 'subjects')}
			> Subjects </button>

			<button
				class="tab"
				class:active={editor_view === 'lectures'}
				on:click={() => navigateEditor(editor_type, 'lectures')}
			> Lectures </button>

			<div class="toolbar">
				{#if editor_type === 'data'}
					<LinkButton on:click={() => navigateEditor('layout', editor_view)}>
						Edit Graph Layout
					</LinkButton>
				{:else}
					<LinkButton on:click={() => navigateEditor('data', editor_view)}>
						Edit Graph Data
					</LinkButton>

					<Dropdown
						id="lecture"
						placeholder="Select lecture"
						bind:value={graphSVG.lecture}
						options={graphSVG.graph.lecture_options}
					/>

					<Button
						disabled={disable_graph_controls}
						on:click={() => graphSVG.centerGraph()}
					> Center Graph </Button>

					<Button
						disabled={disable_graph_controls}
						on:click={() => {
							if (graphSVG.autolayout_enabled) {
								graphSVG.toggleAutolayout()
							} else {
								autolayout_modal.show()
							}
						}}
					> Toggle Autolayout </Button>
				{/if}
			</div>
		</div>

		{#if editor_type === 'data'}
			<div class="header">
				{#if editor_view === 'domains'}
					<DomainHeader />
				{:else if editor_view === 'subjects'}
					<SubjectHeader />
				{:else if editor_view === 'lectures'}
					<LectureHeader />
				{/if}
			</div>
		{/if}
	</div>

	<div class="content">
		{#if editor_type === 'layout'}
			<Graph {graphSVG} />
		{:else if editor_view === 'domains'}
			<DomainTab />
		{:else if editor_view === 'subjects'}
			<SubjectTab />
		{:else if editor_view === 'lectures'}
			<LectureTab />
		{/if}
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.infobox
		display: flex
		flex-flow: row nowrap

		margin: $card-thin-padding $card-thick-padding

		border: 1px solid $purple
		border-radius: $border-radius
		background-color: rgba($purple, 0.1)

		.sidebar
			display: flex
			align-items: center

			padding: $input-icon-padding
			background-color: $purple

			img
				width: 1.5rem
				height: 1.5rem
				filter: $white-filter

		.content
			padding: $card-thin-padding
			color: $dark-purple

	.tabular
		.sticky
			position: sticky
			z-index: 1
			top: 0

			// Workaround for sticky elements, as overflow: hidden is not supported
			margin-top: -$form-small-gap
			padding-top: $form-small-gap
			background: $white

			.tabs
				display: flex

				margin-top: $form-small-gap

				background: $light-gray
				border: 1px solid $gray
				border-bottom: none
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

					:global(.dropdown)
						max-width: 20rem
						margin-left: $form-medium-gap


			.header
				border: 1px solid $gray
				border-width: 0 1px

		.content
			border: 1px solid $gray
			border-top: none
			border-radius: 0 0 $border-radius $border-radius

			:global(.graph)
				height: 850px

</style>