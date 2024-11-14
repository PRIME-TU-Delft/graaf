

<script lang="ts">

	// Internal dependencies
	import { program } from './stores'

	// Components
	import Layout from '$routes/app/+layout.svelte'
	import GeneralCard from './GeneralCard.svelte'
	import CoursesCard from './CoursesCard.svelte'
	import CoordinatorCard from './CoordinatorCard.svelte'

	import Navbar from '$components/Navbar.svelte'

	// Functions
	async function beforeunloadHandler() {
		await $program.save()
		return '' // Prevent default dialog
	}

</script>


<!-- Markup -->


<svelte:window on:beforeunload|preventDefault={beforeunloadHandler} />

<Layout>
	<svelte:fragment slot="title">
		<Navbar path={[
			{
				name: 'Dashboard',
				href: '/app/dashboard'
			},
			
			{
				name: $program.name,
				href: `/app/program/${$program.id}/settings`
			},
			{
				name: 'Program settings',
				href: `/app/course/${$program.id}/settings`
			}
		]} />
		
		Here you can change your program settings, like its courses and coordinators.
	</svelte:fragment>

	<GeneralCard />
	<CoursesCard />
	<CoordinatorCard />

</Layout>
