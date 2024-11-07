
<script lang="ts">

	// Internal dependencies
	import { course, graph } from './stores'

	// Components
	import Layout from '$routes/app/+layout.svelte'
	import GeneralSettings from './GeneralSettings.svelte'
	import DomainSettings from './DomainSettings.svelte'

	import Validation from '$components/Validation.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Tabular from '$components/Tabular.svelte'
	import Navbar from '$components/Navbar.svelte'

	// Update
	const update = () => $graph = $graph

</script>


<!-- Markup -->

{#if $course !== undefined && $graph !== undefined}
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
					href: `/app/graph/${$graph.id}/view`
				},
				{
					name: 'Settings',
					href: `/app/graph/${$graph.id}/settings`
				}
			]} />

			Here you can edit the fields of your graph. Create Domains, Subjects and Lectures to structure your graph.
		</svelte:fragment>

		<svelte:fragment slot="toolbar">
			{#await $graph.validate() then validation}
				<Validation
					data={validation}
					success_msg="Valid graph"
					/>
			{/await}

			<div class="flex-spacer" />

			<LinkButton href="/app/graph/{$graph.id}/layout"> Edit layout </LinkButton>
		</svelte:fragment>

		<Tabular tabs={[
				{
					id: 'general',
					title: 'General',
					content: GeneralSettings
				},
				{
					id: 'domains',
					title: 'Domains',
					content: DomainSettings,
					props: { update }
				}
			]}
		/>

	</Layout>
{/if}