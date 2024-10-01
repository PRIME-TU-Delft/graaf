
<script lang="ts">

	// Internal imports
	import { course, graph } from '$stores'
	import * as settings from '$scripts/settings'

	// Components
	import Button from '$components/Button.svelte'
	import Layout from '$layouts/DefaultLayout.svelte'
	import Validation from '$components/Validation.svelte'

	import GeneralSettings from './GeneralSettings.svelte'
	import DomainSettings from './DomainSettings.svelte'
	import SubjectSettings from './SubjectSettings.svelte'
	import LectureSettings from './LectureSettings.svelte'

	// Functions
	async function load() {
		await $graph.expand()
	}

	function goto_anchor(tab: number, anchor: string) {
		if (active_tab === tab) {
			const element = document.getElementById(anchor)
			element?.scrollIntoView({ behavior: 'smooth' })
			setTimeout(() => {element?.animate(settings.SHAKE.keyframes, settings.SHAKE.options)}, settings.SHAKE.delay)
			return
		}

		active_tab = tab
		setTimeout(() => {
			const element = document.getElementById(anchor)
			element?.scrollIntoView({ behavior: 'smooth' })
			setTimeout(() => {element?.animate(settings.SHAKE.keyframes, settings.SHAKE.options)}, settings.SHAKE.delay)
		}, 0)
	}

	// Variables
	let active_tab = 0


</script>


<!-- Markup -->


{#await load() then}

	<Layout
		description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
		path={[
			{
				name: 'Dashboard',
				href: '/app/dashboard'
			},
			{
				name: `${$course.code} ${$course.name}`,
				href: `/app/course/${$course.id}/overview`
			},
			{
				name: $graph.name,
				href: `/app/course/${$course.id}/graph/${$graph.id}/overview`
			},
			{
				name: 'Settings',
				href: `/app/course/${$course.id}/graph/${$graph.id}/settings`
			}
		]}
	>

			<svelte:fragment slot="toolbar">
				<Validation data={$graph.validate()} success="Valid graph" {goto_anchor} />

				<div class="flex-spacer" />

				<Button href="/app/course/{$course.id}/graph/{$graph.id}/layout"> Edit layout </Button>
			</svelte:fragment>

			<div class="tabular">
				<div class="tabs">
					<button
						class="tab"
						class:active={active_tab === 0}
						on:click={() => active_tab = 0}
					> General </button>
					<button
						class="tab"
						class:active={active_tab === 1}
						on:click={() => active_tab = 1}
					> Domains </button>
					<button
						class="tab"
						class:active={active_tab === 2}
						on:click={() => active_tab = 2}
					> Subjects </button>
					<button
						class="tab"
						class:active={active_tab === 3}
						on:click={() => active_tab = 3}
					> Lectures </button>

					<div class="dynamic-border" />
				</div>

				{#if active_tab === 0}
					<GeneralSettings />
				{:else if active_tab === 1}
					<DomainSettings />
				{:else if active_tab === 2}
					<SubjectSettings />
				{:else if active_tab === 3}
					<LectureSettings />
				{/if}
			</div>
	</Layout>
{/await}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.tab
				padding: $card-thin-padding $card-thick-padding

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

			.dynamic-border
				border-bottom: 1px solid $gray
				flex: 1

</style>
