

<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'

	import type { PageData } from './$types'

	// Internal dependencies
	import { graph } from './stores'

	import {
		ControllerCache,
		GraphController,
		CourseController,
		DomainController,
		SubjectController,
		LectureController
	} from '$scripts/controllers'

	// Components
	import GeneralCard from './GeneralCard.svelte'
	import DomainTab from './DomainTab.svelte'
	import DomainHeader from './DomainHeader.svelte'
	import SubjectTab from './SubjectTab.svelte'
	import SubjectHeader from './SubjectHeader.svelte'
	import LectureTab from './LectureTab.svelte'
	import LectureHeader from './LectureHeader.svelte'

	import Loading from '$components/Loading.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'

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
	}

	function setActiveTab(tab: string) {
		active_tab = tab
		search_params.set('tab', tab)
		goto(`?${search_params.toString()}`, { replaceState: true })
	}

	// Initialization
	export let data: PageData

	const search_params = $page.url.searchParams
	const cache = new ControllerCache()

	let active_tab = search_params.get('tab')

	onMount(() => {
		if (active_tab !== 'domains' && active_tab !== 'subjects' && active_tab !== 'lectures') {
			setActiveTab('domains')
		}
	})

</script>


<!-- Markup -->


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
						class:active={active_tab === 'domains'}
						on:click={() => setActiveTab('domains')}
					> Domains </button>

					<button
						class="tab"
						class:active={active_tab === 'subjects'}
						on:click={() => setActiveTab('subjects')}
					> Subjects </button>

					<button
						class="tab"
						class:active={active_tab === 'lectures'}
						on:click={() => setActiveTab('lectures')}
					> Lectures </button>
				
					<div class="dynamic-border" />
				</div>
			
				<div class="header">
					{#if active_tab === 'domains'}
						<DomainHeader />
					{:else if active_tab === 'subjects'}
						<SubjectHeader />
					{:else if active_tab === 'lectures'}
						<LectureHeader />
					{/if}
				</div>
			</div>
		
			<div class="content">
				{#if active_tab === 'domains'}
					<DomainTab />
				{:else if active_tab === 'subjects'}
					<SubjectTab />
				{:else if active_tab === 'lectures'}
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
			
			.header
				border: 1px solid $gray
				border-width: 0 1px
		
		.content
			border: 1px solid $gray
			border-top: none
			border-radius: 0 0 $border-radius $border-radius

</style>