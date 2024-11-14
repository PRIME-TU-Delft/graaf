
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'

	// Components
	import Layout from '$routes/app/+layout.svelte'
	import GraphCard from './GraphCard.svelte'
	import LinkCard from './LinkCard.svelte'

	import LinkButton from '$components/LinkButton.svelte'
	import Navbar from '$components/Navbar.svelte'

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
			{	name: 'Dashboard',
				href: '/app/dashboard'
			},
			{	name: `${$course.code} ${$course.name}`,
				href: `/app/course/${$course.id}/overview`
			},
			{	name: 'Course overview',
				href: `/app/course/${$course.id}/overview`
			}
		]}>

			<LinkButton href="/app/course/{$course.id}/settings"> Course settings </LinkButton>
		</Navbar>

		Here you can view the graphs and links associated to this course, and edit their properties.
	</svelte:fragment>

	<GraphCard />
	<LinkCard />
</Layout>