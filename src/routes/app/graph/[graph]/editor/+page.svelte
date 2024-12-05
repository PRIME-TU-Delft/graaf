

<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import { graph, save_status } from './stores'

	import {
		ControllerCache,
		GraphController,
		CourseController,
		DomainController,
		SubjectController,
		LectureController
	} from '$scripts/controllers'

	// Components
	import GraphEditor from './GraphEditor.svelte'

	import LinkButton from '$components/LinkButton.svelte'
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
					name: $graph.course.code + ' ' + $graph.course.name,
					href: `/app/course/${$graph.course_id}/overview`
				},
				{
					name: $graph.name
				}
			]}>
				<LinkButton href="/app/graph/{$graph.id}/settings"> Graph Settings </LinkButton>
			</Navbar>

			Here you can edit your graph, like its domains, subjects, and lectures.
		</svelte:fragment>

		<GraphEditor />
	</Layout>
{/await}
