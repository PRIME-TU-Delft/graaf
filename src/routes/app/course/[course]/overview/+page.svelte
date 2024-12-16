
<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import { course } from './stores'

	import {
		ControllerCache,
		CourseController,
		GraphController,
		LinkController,
		DomainController,
		SubjectController,
		LectureController
	} from '$scripts/controllers'

	// Components
	import GraphCard from './GraphCard.svelte'
	import LinkCard from './LinkCard.svelte'

	import LinkButton from '$components/LinkButton.svelte'
	import Loading from '$components/Loading.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'

	// Functions
	async function revive() {

		// Await all promises
		const [
			awaited_course,
			awaited_courses,
			awaited_graphs,
			awaited_links,
			awaited_domains,
			awaited_subjects,
			awaited_lectures
		] = await Promise.all([
			data.course,
			data.courses,
			data.graphs,
			data.links,
			data.domains,
			data.subjects,
			data.lectures
		])

		// Revive controllers into stores
		course.set(CourseController.revive(cache, awaited_course))

		// Revive controllers into cache
		awaited_courses.map(course => CourseController.revive(cache, course))
		awaited_graphs.forEach(graph => GraphController.revive(cache, graph))
		awaited_links.forEach(link => LinkController.revive(cache, link))
		awaited_domains.forEach(domain => DomainController.revive(cache, domain))
		awaited_subjects.forEach(subject => SubjectController.revive(cache, subject))
		awaited_lectures.forEach(lecture => LectureController.revive(cache, lecture))
	}

	
	interface Props {
		// Main
		data: PageData;
	}

	let { data }: Props = $props();
	const cache = new ControllerCache()

</script>

<!-- Markup -->

{#await revive()}
	<Loading />
{:then}
	<Layout>
		{#snippet title()}
			
				<Navbar path={[
					{
						name: 'Home',
						href: '/app/home'
					},
					{
						name: $course.display_name
					}
				]}>

					<LinkButton href="/app/course/{$course.id}/settings"> Course settings </LinkButton>
				</Navbar>

				Here you can view the graphs and links associated to this course, and edit their properties.
			
			{/snippet}

		<GraphCard />
		<LinkCard />
	</Layout>
{/await}