<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import DialogForm from '$lib/components/DialogForm.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { programSchema } from '$lib/utils/zodSchema';
	import Program from './Program.svelte';
	import { fade, fly } from 'svelte/transition';

	const { data } = $props();

	let dialogOpen = $state(false);

	/**
	 * Handle the result of the form submission,
	 * Server or SPA response: success, error, or warning
	 * Read more here: https://superforms.rocks/concepts/events
	 * @param e - ActionResult
	 */
	const form = superForm(data.programForm, {
		validators: zodClient(programSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Program created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;
</script>

<section class="prose mx-auto p-4 text-blue-900">
	<h1 class="my-12 text-4xl font-bold text-blue-950 shadow-blue-500/70">Welcome to the graaf</h1>
	<p>
		Here you can find all Programs and associated Courses. Click on any of them to edit or view more
		information. You can also create a sandbox environment to experiment with the Graph Editor.
		Can't find a specific Program or Course? Maybe you don't have access to it. Contact one of its
		Admins to get access.
	</p>
</section>

<section class="mx-auto my-12 grid max-w-4xl gap-4 p-4">
	<div class="flex items-center justify-between">
		<h2 class="text-xl font-bold">Programs</h2>
		<DialogForm
			bind:open={dialogOpen}
			icon="plus"
			button="New Program"
			title="Create Program"
			description="Programs are collections of Courses, usually pertaining to the same field of study. Looking to try
	out the Graph editor? Try making a sandbox environment instead!"
			disabled={data.error != undefined}
		>
			{@render courseFormSnippet()}
		</DialogForm>
	</div>

	{#each data.programs as program (program.id)}
		<Program {program} courses={data.courses} courseForm={data.courseForm} />
	{/each}
</section>

<section class="mx-auto my-12 grid max-w-4xl gap-4 p-4">
	<h2 class="text-xl font-bold">Archived programs</h2>
	{#await data.archivedPrograms}
		<p class="bg-base w-full rounded p-2 text-slate-800">Loading...</p>
	{:then archivedPrograms}
		{#if archivedPrograms.length == 0}
			<p>No archived programs</p>
		{/if}
		<div class="block" transition:fade={{ duration: 400 }}>
			{#each archivedPrograms as program (program.id)}
				<Program {program} courses={data.courses} courseForm={data.courseForm} />
			{/each}
		</div>
	{/await}
</section>

<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
{#snippet courseFormSnippet()}
	<form action="?/new-program" method="POST" use:enhance>
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Program name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		</Form.Field>

		<Form.Button class="float-right mt-4">Submit</Form.Button>
	</form>
{/snippet}
