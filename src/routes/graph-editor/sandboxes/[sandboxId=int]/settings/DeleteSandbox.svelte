<script lang="ts">
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { deleteSandboxSchema } from '$lib/zod/sandboxSchema';
	
	import * as Form from '$lib/components/ui/form/index.js';
	
	import type { Sandbox } from '@prisma/client';
	import type { PageData } from './$types';

	type DeleteSandboxProps = {
		sandbox: Sandbox;
		onSuccess: () => void;
	};

	let { sandbox, onSuccess }: DeleteSandboxProps = $props();

	const data = page.data as PageData;
	const form = superForm(data.deleteSandboxForm, {
		id: 'delete-sandbox',
		validators: zodClient(deleteSandboxSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success(`Deleted sandbox ${sandbox.name}`);
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.sandboxId = sandbox.id;
	});
</script>

<form action="?/delete-sandbox" method="POST" class="ml-auto" use:enhance>
	<input type="hidden" name="sandboxId" value={sandbox.id} />

	<Form.FormError {form} />
	<Form.FormButton
		variant="destructive"
		disabled={$submitting}
		loading={$delayed}
		class="justify-self-end"
	>
		Delete sandbox
		{#snippet loadingMessage()}
			<span>Deleting sandbox...</span>
		{/snippet}
	</Form.FormButton>
</form>
