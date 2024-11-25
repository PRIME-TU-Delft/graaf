

<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import { course } from './stores'

	import {
		ControllerCache,
		CourseController,
		ProgramController,
		UserController
	} from '$scripts/controllers'

	// Components
	import MemberCard from './MemberCard.svelte'
	import GeneralCard from './GeneralCard.svelte'
	import ProgramCard from './ProgramCard.svelte'

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
			awaited_programs,
			awaited_users
		] = await Promise.all([
			data.course,
			data.courses,
			data.programs,
			data.users
		])

		// Revive controllers into stores
		course.set(CourseController.revive(cache, awaited_course))

		// Revive controllers into cache
		awaited_programs.forEach(program => ProgramController.revive(cache, program))
		awaited_courses.forEach(course => CourseController.revive(cache, course))
		awaited_users.forEach(user => UserController.revive(cache, user))
	}

	// Main
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
					name: `${$course.code} ${$course.name}`,
					href: `/app/course/${$course.id}/overview`
				},
				{
					name: 'Settings'
				}
			]}>
				<LinkButton href={`/app/course/${$course.id}/overview`}> Course overview </LinkButton>
			</Navbar>

			Here you can change your course settings, like its members, graphs, links, etc.
		</svelte:fragment>

		<GeneralCard />
		<MemberCard />
		<ProgramCard />

	</Layout>
{/await}
