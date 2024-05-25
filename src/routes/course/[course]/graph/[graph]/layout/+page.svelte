
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Lib imports
	import { GraphSVG, GraphType } from '$scripts/graph/graphSVG'

	// Components
	import DefaultLayout from '$layouts/DefaultLayout.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'
	import LinkButton from '$components/LinkButton.svelte'

	// Exports
	export let data: PageData

	// Variables
	let { course, graph } = data
	let graphSVG: GraphSVG = new GraphSVG(graph, true)
	let activeTab: number = 0

</script>



<!-- Markup -->



<DefaultLayout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: "Dashboard",
			href: "/dashboard"
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/course/${course.code}/overview`
		},
		{
			name: graph.name,
			href: `/course/${course.code}/graph/${graph.id}/overview`
		},
		{
			name: "Edit",
			href: `/course/${course.code}/graph/${graph.id}/edit`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<div class="flex-spacer" />
		<LinkButton href={`/course/${course.code}/graph/${graph.id}/settings`}> Settings </LinkButton>
		<Button on:click={() => graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>
	</svelte:fragment>

	<div class="tabular">
		<div class="tabs">
			<button
				class:active={activeTab === 0}
				on:click={() => {
					graphSVG.show(GraphType.domain)
					activeTab = 0
				}}
			> Domains </button>

			<button
				class:active={activeTab === 1}
				on:click={() => {
					graphSVG.show(GraphType.subject)
					activeTab = 1
				}}
			> Subjects </button>

			<button
				class:active={activeTab === 2}
				on:click={() => {
					graphSVG.show(GraphType.lecture, graph.lectures ? graph.lectures[0] : undefined)
					activeTab = 2
				}}
			> Lectures </button>

			<div class="dynamic-border" />
		</div>

		<div class="editor">
			<svg use:graphSVG.create />
		</div>
	</div>
</DefaultLayout>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		height: 650px

		svg
			width: 100%
			height: 100%

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