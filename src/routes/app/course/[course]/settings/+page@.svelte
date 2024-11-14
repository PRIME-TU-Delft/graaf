

<script lang="ts">

	// Internal dependencies
	import { course } from './stores'

	// Components
	import Layout from '$routes/app/+layout.svelte'
	import GeneralCard from './GeneralCard.svelte'
	import ProgramCard from './ProgramCard.svelte'
	import CoordinatorCard from './CoordinatorCard.svelte'

	import Navbar from '$components/Navbar.svelte'
	import LinkButton from '$components/LinkButton.svelte';

	// Functions
	async function beforeunloadHandler() {
		await $course.save()
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
				name: `${$course.code} ${$course.name}`,
				href: `/app/course/${$course.id}/overview`
			},
			{
				name: 'Course settings',
				href: `/app/course/${$course.id}/settings`
			}
		]}>
			<LinkButton href={`/app/course/${$course.id}/overview`}> Course overview </LinkButton>
		</Navbar>
		
		Here you can change your course settings, like its coordinators, graphs, links, etc.
	</svelte:fragment>

	<GeneralCard />
	<ProgramCard />
	<CoordinatorCard />

</Layout>
