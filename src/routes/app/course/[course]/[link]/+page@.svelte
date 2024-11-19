
<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'
	import { page } from '$app/stores'

	// Internal dependencies
	import { GraphSVG } from '$scripts/svg'
	import { validEditorView } from '$scripts/types'

	import {
		ControllerCache,
		GraphController,
		DomainController,
		SubjectController,
		LectureController
	} from '$scripts/controllers'

	// Components
	import Dropdown from '$components/Dropdown.svelte'
	import Loading from '$components/Loading.svelte'
	import Button from '$components/Button.svelte'
	import Graph from '$components/Graph.svelte'

	// Functions
	async function revive() {

		// Await all promises
		const [
			awaited_graph,
			awaited_domains,
			awaited_subjects,
			awaited_lectures
		] = await Promise.all([
			data.graph,
			data.domains,
			data.subjects,
			data.lectures
		])

		// Revive graph
		graph = GraphController.revive(cache, awaited_graph)

		// Revive controllers into cache
		awaited_domains.forEach(domain => DomainController.revive(cache, domain))
		awaited_subjects.forEach(subject => SubjectController.revive(cache, subject))
		awaited_lectures.forEach(lecture => LectureController.revive(cache, lecture))

		// Create graphSVG
		graphSVG = new GraphSVG(graph, false)

		const lecture = cache.find(LectureController, editor_lecture)
		if (lecture !== undefined)
			graphSVG.lecture = lecture
		if (validEditorView(editor_view)) {
			graphSVG.view = editor_view
		}
	}

	// Initialization
	export let data: PageData
	const cache = new ControllerCache()

	let graph: GraphController
	let graphSVG: GraphSVG

	const search_params = $page.url.searchParams
	let editor_view = search_params.get('view')
	let editor_lecture = Number(search_params.get('lecture'))

</script>


<!-- Markup -->


{#await revive()}
	<Loading />
{:then}
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
			</div>
		</div>

		<Graph {graphSVG} />
	</div>
{/await}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		position: relative
		
		width: 100vw
		height: 100vh
		background: $white

		.tabs
			position: absolute
			z-index: 1
			top: 0

			display: flex
			width: 100%

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

				:global(.dropdown)
					max-width: 20rem
					margin-left: $form-medium-gap

</style>