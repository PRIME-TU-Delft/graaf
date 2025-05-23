<script lang="ts">
	import { page } from '$app/state';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { newProgramSchema } from '$lib/zod/programSchema';

	// Components
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';

	import type { PageData } from './$types';

	const data = page.data as PageData;
	const form = superForm(data.newProgramForm, {
		id: useId(),
		validators: zodClient(newProgramSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Program created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;
	let dialogOpen = $state(false);
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="Add Program"
	title="Create Program"
	description="Programs are collections of Courses, usually pertaining to the same field of study. Looking to try
	out the Graph editor? Try making a sandbox environment instead!"
>
	<!-- For sumbitting a NEW PROGRAM
 	It triggers an action that can be seen in +page.server.ts -->
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

		<div class="mt-4 flex w-full justify-end">
			<Form.FormButton
				disabled={$submitting}
				loading={$delayed}
				loadingMessage="Creating program..."
			>
				Create new program
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
