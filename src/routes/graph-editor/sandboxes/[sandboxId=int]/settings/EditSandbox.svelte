<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editSandboxSchema } from '$lib/zod/sandboxSchema';

	// Components
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button } from '$lib/components/ui/button';

	// Icons
	import { Undo2 } from '@lucide/svelte';

	// Types
	import type { PageData } from './$types';

	const data = page.data as PageData;

	// Build the form
	const form = superForm(data.editSandboxForm, {
		validators: zodClient(editSandboxSchema),
		id: `edit-sandbox`,
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success(`Updated sandbox ${data.sandbox.name}`);
				editSandboxDialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	// Svelte stuff
	let editSandboxDialogOpen = $state(false);

	$effect(() => {
		$formData.sandboxId = data.sandbox.id;
		$formData.name = data.sandbox.name;
	});
</script>

<DialogButton
	bind:open={editSandboxDialogOpen}
	button="Edit sandbox name"
	icon="edit"
	title="Edit the name of this sandbox"
>
	<form action="?/edit-sandbox" method="POST" use:enhance>
		<input type="hidden" name="sandboxId" value={data.sandbox.id} />

		<div class="flex gap-3">
			<Form.Field {form} name="name" class="grow">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>New name</Form.Label>
						<Input {...props} bind:value={$formData.name} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="mt-2 flex items-center justify-between gap-1">
			<Form.FormError class="w-full" {form} />
			<Button
				variant="outline"
				onclick={() =>
					form.reset({
						newState: {
							name: data.sandbox.name,
							sandboxId: data.sandbox.id
						}
					})}
			>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={$submitting} loading={$delayed}>
				Save new name
				{#snippet loadingMessage()}
					<span>Saving new name...</span>
				{/snippet}
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
