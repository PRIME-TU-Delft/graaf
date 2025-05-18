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
				<Form.FieldErrors class="mb-2" />
			</Form.Field>
		</div>
	
		<Form.FormError class="my-2" {form} />
	
		<Form.FormButton
			class="float-right"
			disabled={$submitting || $formData.name == data.sandbox.name}
			loading={$delayed}
		>
			Save new name
			{#snippet loadingMessage()}
				<span>Saving new name...</span>
			{/snippet}
		</Form.FormButton>
	</form>
</DialogButton>


