

<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'

	import type { PageData } from './$types'

	// Internal dependencies
	import { graph } from './stores'
	import { GraphSVG, SVGState } from '$scripts/svg'

	import {
		ControllerCache,
		GraphController,
		CourseController,
		DomainController,
		SubjectController,
		LectureController
	} from '$scripts/controllers'

	import {
		validEditorType,
		validEditorView
	} from '$scripts/types'

	import type {
		EditorType,
		EditorView
	} from '$scripts/types'

	// Components
	import GeneralCard from './GeneralCard.svelte'
	import DomainTab from './DomainTab.svelte'
	import DomainHeader from './DomainHeader.svelte'
	import SubjectTab from './SubjectTab.svelte'
	import SubjectHeader from './SubjectHeader.svelte'
	import LectureTab from './LectureTab.svelte'
	import LectureHeader from './LectureHeader.svelte'

	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Loading from '$components/Loading.svelte'
	import Button from '$components/Button.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'
	import Modal from '$components/Modal.svelte'
	import Graph from '$components/Graph.svelte'

	// Assets
	import info_icon from '$assets/info-icon.svg'

	// Functions
	async function revive() {

		// Await all promises
		const [
			awaited_graph,
			awaited_course,
			awaited_domains,
			awaited_subjects,
			awaited_lectures
		] = await Promise.all([
			data.graph,
			data.course,
			data.domains,
			data.subjects,
			data.lectures
		])

		// Revive controllers into stores
		graph.set(GraphController.revive(cache, awaited_graph))

		// Revive controllers into cache
		CourseController.revive(cache, awaited_course)
		awaited_domains.forEach(domain => DomainController.revive(cache, domain))
		awaited_subjects.forEach(subject => SubjectController.revive(cache, subject))
		awaited_lectures.forEach(lecture => LectureController.revive(cache, lecture))

		// Initialize SVG
		graphSVG = new GraphSVG($graph)

		// Initialize editor
		navigateEditor(
			validEditorType(editor_type) ? editor_type : 'nodes',
			validEditorView(editor_view) ? editor_view : 'domains'
		)
	}

	function navigateEditor(type: EditorType, view: EditorView) {
		if (graphSVG.state === SVGState.animating) return

		editor_view = view
		editor_type = type

		search_params.set('type', editor_type)
		search_params.set('view', editor_view)
		goto(`?${search_params.toString()}`, { replaceState: true })

		graphSVG.view = view
	}

	// Initialization
	export let data: PageData

	const cache = new ControllerCache()
	let graphSVG: GraphSVG

	const search_params = $page.url.searchParams
	let editor_type = search_params.get('type') as EditorType
	let editor_view = search_params.get('view') as EditorView

	let autolayout_modal: Modal

</script>


<!-- Markup -->


<Modal bind:this={autolayout_modal}>
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
		<LinkButton on:click={() => autolayout_modal.hide()}> Cancel </LinkButton>
		<Button on:click={() => {
			graphSVG.toggleAutolayout()
			autolayout_modal.hide()
		}}> Start Autolayout </Button>
	</svelte:fragment>
</Modal>

{#await revive()}
	<Loading />
{:then}
	<Layout>
		<svelte:fragment slot="title">
			<Navbar path={[
				{
					name: 'Home',
					href: '/app/home'
				},
				{
					name: $graph.course.code + ' ' + $graph.course.name,
					href: `/app/course/${$graph.course_id}/overview`
				},
				{
					name: $graph.name
				}
			]} />

			Here you can edit your graph, like its domains, subjects, and lectures.
		</svelte:fragment>

		<GeneralCard />

		<div class="tabular">
			<div class="sticky" id="sticky-tabular-header">
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
						{#if editor_type === 'nodes'}
							<LinkButton on:click={() => navigateEditor('layout', editor_view)}>
								Edit Layout
							</LinkButton>
						{:else}
							<LinkButton on:click={() => navigateEditor('nodes', editor_view)}>
								Edit Nodes & Relations
							</LinkButton>

							<Dropdown
								id="lecture"
								placeholder="Select lecture"
								bind:value={graphSVG.lecture}
								options={graphSVG.graph.lecture_options}
							/>

							<Button on:click={() => graphSVG.findGraph()}>
								Find Graph
							</Button>

							<Button on:click={() => {
								if (graphSVG.autolayout_enabled) {
									graphSVG.toggleAutolayout()
								} else {
									autolayout_modal.show()
								}
							}}>
								Toggle Autolayout
							</Button>
						{/if}
					</div>
				</div>

				{#if editor_type === 'nodes'}
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
	</Layout>
{/await}


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
			margin-top: -$form-medium-gap
			padding-top: $form-medium-gap
			background: $white

			.tabs
				display: flex

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

			svg
				display: block
				width: 100%
				height: 600px

				&:empty
					display: none

</style>