
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'

	// Internal dependencies
	import { course, graph, domains, subjects, lectures } from './stores'

	// Components
	import Layout from '$routes/app/+layout.svelte'

	import Validation from '$components/Validation.svelte'
	import Tabular from '$components/Tabular.svelte'
	import Button from '$components/Button.svelte'
	import Navbar from '$components/Navbar.svelte'

	import GeneralSettings from './GeneralSettings.svelte'

	// Update
	const update = () => $graph = $graph

	// Stores
	onMount(() => {
		graph.subscribe(async graph => $course = await graph.getCourse())
		graph.subscribe(async graph => $domains = await graph.getDomains())
		graph.subscribe(async graph => $subjects = await graph.getSubjects())
		graph.subscribe(async graph => $lectures = await graph.getLectures())
	})

</script>


<!-- Markup -->


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
				name: $graph.name,
				href: `/app/graph/${$graph.id}/overview`
			},
			{
				name: 'Settings',
				href: `/app/graph/${$graph.id}/settings`
			}
		]}
		/>

		Here you can edit the fields of your graph. Create Domains, Subjects and Lectures to structure your graph.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		{#await $graph.validate() then validation}
			<Validation
				data={validation}
				success="Valid graph"
				/>
		{/await}

		<div class="flex-spacer" />

		<Button href="/app/graph/{$graph.id}/layout"> Edit layout </Button>
	</svelte:fragment>

	<Tabular tabs={[
			{
				id: 'general',
				title: 'General',
				content: GeneralSettings,
				props: { update }
			}
		]}
	/>

</Layout>