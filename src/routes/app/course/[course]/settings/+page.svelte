

<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	// Internal dependencies
	import type { ProgramController } from '$scripts/controllers'
	import type { ValidationData } from '$scripts/validation'
	import type { DropdownOption } from '$scripts/types'

	// Components
	import Layout from '$components/layouts/DefaultLayout.svelte'
	import Tabular from '$components/layouts/Tabular.svelte'
	import Modal from '$components/layouts/Modal.svelte'
	import Validation from '$components/Validation.svelte'
	import Button from '$components/buttons/Button.svelte'

	import GeneralSettings from './GeneralSettings.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'
	import LinkButton from '$components/buttons/LinkButton.svelte'
	
	// Exports
	export let data

	// Stores
	const course = writable(data.course)
	const course_validation = writable<ValidationData | undefined>(undefined)
	const programs = writable(data.programs)
	const program_options = writable<DropdownOption<ProgramController>[] | undefined>(undefined)

	onMount(() => {
		course.subscribe(async () => $programs = await $course.getPrograms())
		course.subscribe(async () => $course_validation = await $course.validate())
		course.subscribe(async () => $program_options = await $course.getProgramOptions())
	})

	// Modals
	let archive_modal: Modal

	// Update
	const update = () => $course = $course

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
			name: 'Settings',
			href: `/app/course/${$course.id}/settings`
		}
	]}
>
	<svelte:fragment slot="header">
		Here you can change your course settings, like its coordinators, graps, links, etc.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		{#if $course_validation !== undefined}
			<Validation data={$course_validation} />
		{/if}

		<div class="flex-spacer" />

		<Button dangerous on:click={() => archive_modal.show()}>
			<img src={trashIcon} alt="" /> Archive Course
		</Button>
	</svelte:fragment>

	<Tabular
		tabs={[
			{
				title: 'General',
				content: GeneralSettings,
				props: { 
					course: $course, 
					programs: $programs,
					program_options: $program_options,
					update
				}
			}
		]} 
	/>
	
</Layout>

<Modal bind:this={archive_modal}>
	<h3 slot="header"> Archive Course </h3>
	When you archive a course, it, and all associated graphs and links will no longer be visible to anyone except program administrators. Only they can restore them.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => archive_modal.hide()}> Cancel </LinkButton>
		<Button on:click={() => archive_modal.hide()}> Archive </Button>
	</svelte:fragment>
</Modal>