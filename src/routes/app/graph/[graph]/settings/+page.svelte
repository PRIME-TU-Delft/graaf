

<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import { graph, save_status } from './stores'

	import {
		ControllerCache,
		GraphController,
		CourseController
	} from '$scripts/controllers'

	// Components
	import GeneralCard from '../settings/GeneralCard.svelte'

	import SaveStatus from '$components/SaveStatus.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Loading from '$components/Loading.svelte'
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
					name: $graph.course.display_name,
					href: `/app/course/${$graph.course_id}/overview`
				},
				{
					name: $graph.display_name,
					href: `/app/graph/${$graph.id}/editor`
				},
				{
					name: 'Settings'
				}
			]}>
				<LinkButton href="/app/graph/{$graph.id}/editor"> Graph Editor </LinkButton>
			</Navbar>

			Here you can edit your graph, like its domains, subjects, and lectures.
		</svelte:fragment>

		<SaveStatus bind:this={ $save_status } />
		<GeneralCard />		
	</Layout>
{/await}
