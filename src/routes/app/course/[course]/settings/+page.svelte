

<script lang="ts">

	// Components
	import Layout from '$components/layouts/DefaultLayout.svelte'
	import Tabular from '$components/layouts/Tabular.svelte'
	import GeneralSettings from './GeneralSettings.svelte'
	import CoordinatorSettings from './CoordinatorSettings.svelte'
	import Validation from '$components/Validation.svelte'
	import Button from '$components/buttons/Button.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'
	
	// Variables
	export let data
	const cache = data.cache
	const course = data.course

</script>


<!-- Markup -->

<Layout
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/app/course/${course.id}/overview`
		}
	]}
>
	<svelte:fragment slot="header">
		Here you can change your course settings, like its coordinators, graps, links, etc.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		{#await course.validate() then validation}
			<Validation data={validation} />
		{/await}

		<div class="flex-spacer" />

		<Button dangerous on:click={() => archive_modal.show()}>
			<img src={trashIcon} alt="" /> Archive Modal
		</Button>
	</svelte:fragment>

	<Tabular
		tabs={[
			{
				title: 'General',
				content: GeneralSettings,
				props: { course }
			},
			{
				title: 'Coordinators',
				content: CoordinatorSettings,
				props: { course }
			}
		]} 
		/>
	
</Layout>