

<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import { graph } from './stores'

	import {
		ControllerCache,
		GraphController,
		CourseController
	} from '$scripts/controllers'

	// Components
	import GeneralCard from './GeneralCard.svelte'
	import DomainTab from './DomainTab.svelte'
	import SubjectTab from './SubjectTab.svelte'
	import LectureTab from './LectureTab.svelte'

	import Loading from '$components/Loading.svelte'
	import Tabular from '$components/Tabular.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'

	// Functions
	async function revive() {

		// Await all promises
		const [
			awaited_graph,
			awaited_course
		] = await Promise.all([
			data.graph,
			data.course
		])

		// Revive controllers into stores
		graph.set(GraphController.revive(cache, awaited_graph))

		// Revive controllers into cache
		CourseController.revive(cache, awaited_course)
	}

	// Initialization
	export let data: PageData
	const cache = new ControllerCache()

</script>


<!-- Markup -->


<svelte:window on:beforeunload|preventDefault={async () => $graph.save()} />

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
		
		Here you can change your graph settings, like its domains, subjects, and lectures.
	</svelte:fragment>

	<GeneralCard />
	<Tabular tabs={[
		{
			id: 'domains',
			title: 'Domains',
			content: DomainTab
		},
		{
			id: 'subjects',
			title: 'Subjects',
			content: SubjectTab
		},
		{
			id: 'lectures',
			title: 'Lectures',
			content: LectureTab
		}
	]} />

	</Layout>
{/await}
