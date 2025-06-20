<script lang="ts">
	import { page } from '$app/state';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { newSandboxSchema } from '$lib/zod/sandboxSchema';

	// Components
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';

	import type { PageData } from './$types';

	const data = page.data as PageData;
	const form = superForm(data.newSandboxForm, {
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
	variant="outline"
	class="h-full w-full rounded border-2 border-purple-200 bg-purple-100/50 p-2 transition-colors hover:bg-purple-100 hover:shadow-none"
	description="Sandboxes are collections of graphs, used for experimentation, personal projects, or assignments. They should not be used to represent a university course."
>
	<!-- For sumbitting a NEW SANDBOX
 	It triggers an action that can be seen in +page.server.ts -->
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
