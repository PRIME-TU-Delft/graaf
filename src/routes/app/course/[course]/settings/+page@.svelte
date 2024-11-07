

<script lang="ts">

	// Internal dependencies
	import { course } from './stores'

	// Components
	import Layout from '$routes/app/+layout.svelte'
	import GeneralSettings from './GeneralSettings.svelte'
	import CoordinatorSettings from './CoordinatorSettings.svelte'

	import Validation from '$components/Validation.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Tabular from '$components/Tabular.svelte'
	import Navbar from '$components/Navbar.svelte'
	
	// Update
	const update = () => $course = $course

</script>


<!-- Markup -->


{#if $course !== undefined}
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
					name: 'Settings',
					href: `/app/course/${$course.id}/settings`
				}
			]} />

			Here you can change your course settings, like its coordinators, graphs, links, etc.
		</svelte:fragment>

		<svelte:fragment slot="toolbar">
			<Validation data={$course.validate()} />
			<div class="flex-spacer" />
			<LinkButton href="/app/course/{$course.id}/overview"> Course overview </LinkButton>
		</svelte:fragment>

		<Tabular
			tabs={[
				{
					id: 'general',
					title: 'General',
					content: GeneralSettings,
					props: { update }
				},
				{
					id: 'coordinators',
					title: 'Coordinators',
					content: CoordinatorSettings,
					props: { update }
				}
			]} 
		/>
			
	</Layout>
{/if}