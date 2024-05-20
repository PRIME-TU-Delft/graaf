
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte'
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import FieldSettings from './FieldSettings.svelte'
	import GeneralSettings from './GeneralSettings.svelte'
	import RelationSettings from './RelationSettings.svelte'
	import LectureSettings from './LectureSettings.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'

	// Exports
	export let data: PageData

	// Variables
	let { course, graph } = data
	let activeTab: number = 0

</script>



<!-- Markup -->



<Layout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: 'Dashboard',
			href: '/dashboard'
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
			name: 'Settings',
			href: `/course/${course.code}/graph/${graph.id}/settings`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<div class="flex-spacer" />
		<LinkButton href="/course/{course.code}/graph/{graph.id}/layout"> Edit layout </LinkButton>
		<Button on:click={() => graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>
	</svelte:fragment>

	<div class="tabular">
		<div class="tabs">
			<button class:active={activeTab === 0} on:click={() => activeTab = 0}> General </button>
			<button class:active={activeTab === 1} on:click={() => activeTab = 1}> Domains & Subjects </button>
			<button class:active={activeTab === 2} on:click={() => activeTab = 2}> Relations </button>
			<button class:active={activeTab === 3} on:click={() => activeTab = 3}> Lectures </button>

			<div class="dynamic-border" />
		</div>

		{#if activeTab === 0}
			<GeneralSettings {graph} />
		{:else if activeTab === 1}
			<FieldSettings {graph} />
		{:else if activeTab === 2}
			<RelationSettings {graph} />
		{:else if activeTab === 3}
			<LectureSettings {graph} />
		{/if}
	</div>
</Layout>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

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
