<script lang="ts">
	import Layout from '$components/Layout.svelte';
	import Modal from '$components/Modal.svelte';
	import Searchbar from '$components/Searchbar.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { ControllerCache, ProgramController } from '$scripts/controllers';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import ProgramCard from './ProgramCard.svelte';
	import { programSchema } from './schema';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const form = superForm(data.form, {
		validators: zodClient(programSchema)
	});

	const { form: formData, enhance, submit, errors } = form;
	const cache = new ControllerCache();

	let programModalOpen = $state(false);
	const programErrors = $errors;

	let query = $state('');

	function programModalSubmit() {
		const errors = Object.values(programErrors).flatMap((v) => v);

		if (errors.length == 0) {
			submit();
			programModalOpen = false;
		}
	}
</script>

<Layout title="Home">
	{#snippet header()}
		Here you can find all Programs and associated Courses. Click on any of them to edit or view more
		information. You can also create a sandbox environment to experiment with the Graph Editor.
		Can't find a specific Program or Course? Maybe you don't have access to it. Contact one of its
		Admins to get access.
	{/snippet}

	{#snippet toolbar()}
		<Modal
			bind:open={programModalOpen}
			triggerName="New Program"
			icon="plus"
			title="Create Course"
			description="Programs are collections of Courses, usually pertaining to the same field of study. Looking to try
	out the Graph editor? Try making a sandbox environment instead!"
		>
			{@render programModal()}
		</Modal>

		<div class="grow"></div>

		<Searchbar placeholder="Search courses" bind:value={query} />
	{/snippet}

	<!-- <CoursesCard /> -->

	{#await data.programs}
		Loading programs...
	{:then programs}
		{#each programs as programSerial}
			{@const program = ProgramController.revive(cache, programSerial)}
			<ProgramCard {program} />
		{/each}
	{/await}
</Layout>

{#snippet programModal()}
	<form method="POST" use:enhance>
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Program Name</Form.Label>
					<Input {...props} bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />

			<div class="flex w-full items-center justify-end gap-2">
				<Form.Button onclick={programModalSubmit}>Submit</Form.Button>
			</div>
		</Form.Field>
	</form>
{/snippet}
