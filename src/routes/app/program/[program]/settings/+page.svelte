
<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import { courses, program, save_status } from './stores'

	import {
		ControllerCache,
		ProgramController,
		CourseController,
		UserController
	} from '$scripts/controllers'

	// Components
	import GeneralCard from './GeneralCard.svelte'
	import CoursesCard from './CoursesCard.svelte'
	import MemberCard from './MemberCard.svelte'

	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'
	import Loading from '$components/Loading.svelte'
	import SaveStatus from '$components/SaveStatus.svelte';

	// Functions
	async function revive() {

		// Await all promises
		const [
			awaited_program,
			awaited_course,
			awaited_user
		] = await Promise.all([
			data.program,
			data.courses,
			data.users
		])

		// Revive controllers into stores
		program.set(ProgramController.revive(cache, awaited_program))
		courses.set(awaited_course.map(course => CourseController.revive(cache, course)))

		// Revive controllers into cache
		awaited_user.forEach(user => UserController.revive(cache, user))
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
					name: $program.display_name
				}
			]} />

			Here you can change your program settings, like its courses and members.
		</svelte:fragment>

		<SaveStatus bind:this={ $save_status } />
		<GeneralCard />
		<MemberCard />
		<CoursesCard />

	</Layout>
{/await}
