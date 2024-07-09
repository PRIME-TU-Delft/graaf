
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'
	import { writable } from 'svelte/store'
	import { setContext } from 'svelte'

	// Internal imports
	import { Severity } from '$scripts/entities'

	// Components
	import Button from '$components/Button.svelte'
	import Layout from '$layouts/DefaultLayout.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Validation from '$components/Validation.svelte'
	
	import GeneralSettings from './GeneralSettings.svelte'
	import DomainSettings from './DomainSettings.svelte';
	import SubjectSettings from './SubjectSettings.svelte';
	import LectureSettings from './LectureSettings.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'
	import { Course, Graph } from '$scripts/entities';

	// Functions
	function goto_anchor(tab: number, id: string) {
		if (active_tab === tab) {
			const element = document.getElementById(id)
			element?.scrollIntoView({ behavior: 'smooth' })
			element?.animate(shake.keyframes, shake.options)
			return
		}

		active_tab = tab
		setTimeout(() => {
			const element = document.getElementById(id)
			element?.scrollIntoView({ behavior: 'smooth' })
			setTimeout(() => {element?.animate(shake.keyframes, shake.options)}, shake.delay)
		}, 0)
	}

	// Variables
	export let data: PageData
	const course = writable(Course.revive(data.course))
	const graph = writable(Graph.revive(data.graph))
	setContext('course', course)
	setContext('graph', graph)

	let active_tab: number = 0
	$: validation = $graph.validate()

	const shake = {
		delay: 150,
		keyframes: [
			{ transform: 'translate3d(0, 0, 0)'},
			{ transform: 'translate3d(-10px, 0, 0)'},
			{ transform: 'translate3d(8px, 0, 0)'},
			{ transform: 'translate3d(-6px, 0, 0)'},
			{ transform: 'translate3d(4px, 0, 0)'},
			{ transform: 'translate3d(-2px, 0, 0)'},
			{ transform: 'translate3d(0, 0, 0)'}
		],
		options: {
			duration: 400,
			easeing: 'cubic-bezier(.15,.5,.25,.95)',
		}
	}

</script>


<!-- Markup -->


<Layout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		},
		{
			name: `${$course.code} ${$course.name}`,
			href: `/app/course/${$course.code}/overview`
		},
		{
			name: $graph.name,
			href: `/app/course/${$course.code}/graph/${$graph.id}/overview`
		},
		{
			name: 'Settings',
			href: `/app/course/${$course.code}/graph/${$graph.id}/settings`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Validation data={validation} success="Ready to save" {goto_anchor} />
		<div class="flex-spacer" />
		<LinkButton href="/app/course/{$course.code}/graph/{$graph.id}/layout"> Edit layout </LinkButton>
		<Button disabled={validation.severity === Severity.error} on:click={() => $graph.save()}>
			<img src={saveIcon} alt=""> Save Changes 
		</Button>
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


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.tabular
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			overflow-x: scroll

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
