<script lang="ts">
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { newSandboxSchema } from '$lib/zod/sandboxSchema';

	// Components
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';

	// Types
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	type Props = {
		newSandboxForm: SuperValidated<Infer<typeof newSandboxSchema>>;
	};

	const { newSandboxForm }: Props = $props();

	const form = superForm(newSandboxForm, {
		id: useId(),
		validators: zodClient(newSandboxSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Sandbox created successfully!');
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
	button="Create Sandbox"
	title="Create Sandbox"
	description="Sandboxes are collections of graphs, used for experimentation, personal projects, or assignments. They should not be used to represent a university course."
>
	<form action="?/new-sandbox" method="POST" use:enhance>
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Sandbox name</Form.Label>
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
				loadingMessage="Creating sandbox..."
			>
				Create new sandbox
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
