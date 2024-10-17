
<script lang="ts">

	// External dependencies
	import { writable } from 'svelte/store'

	// Components
	import Layout from '$components/layouts/DefaultLayout.svelte'
	import Tabular from '$components/layouts/Tabular.svelte'
	import GeneralSettings from './GeneralSettings.svelte'
	import Button from '$components/buttons/Button.svelte'
	import Validation from '$components/Validation.svelte'

	// Variables
	export let data
	const cache = data.cache
	const course = writable(data.course)
	const graph = writable(data.graph)

</script>


<!-- Markup -->


<Layout
	path={[
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
			href: `/app/course/${$course.id}/graph/${$graph.id}/overview`
		},
		{
			name: 'Settings',
			href: `/app/course/${$course.id}/graph/${$graph.id}/settings`
		}
	]}
>

	<svelte:fragment slot="header">
		Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		{#await $graph.validate() then validation}
			<Validation
				data={validation}
				success="Valid graph"
				/>
		{/await}

		<div class="flex-spacer" />

		<Button href="/app/course/{$course.id}/graph/{$graph.id}/layout"> Edit layout </Button>
	</svelte:fragment>

	<Tabular tabs={[
			{
				title: 'General',
				content: GeneralSettings,
				props: {
					course: $course,
					graph: $graph,
					update: () => {
						$course = $course
						$graph = $graph
					}
				}
			}
		]}
	/>

</Layout>