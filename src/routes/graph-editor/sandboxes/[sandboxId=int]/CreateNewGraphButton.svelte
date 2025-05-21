<script lang="ts">
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { newGraphSchema } from '$lib/zod/graphSchema';
	import { page } from '$app/state';

	// Components
	import { Input } from '$lib/components/ui/input';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button';

	// Icons
	import { Plus, Undo2 } from '@lucide/svelte';

	// Types
	import type { PageData } from './$types';
	import type { Sandbox } from '@prisma/client';

	type CreateNewGraphButtonProps = {
		sandbox: Sandbox;
	};

	let { sandbox }: CreateNewGraphButtonProps = $props();

	const data = page.data as PageData;
	const form = superForm(data.newGraphForm, {
		validators: zodClient(newGraphSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Graph created successfully!');
				dialogOpen = false;
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	let dialogOpen = $state(false);

	$effect(() => {
		$formData.name = '';
		$formData.parentId = sandbox.id;
		$formData.parentType = 'SANDBOX';
	});
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Graph"
	title="Create Graph"
	description="Graphs are collections of domains, subjects and lectures, usually pertaining to the same field of study."
	class="w-full "
>
	<form action="?/new-graph" method="POST" use:enhance>
		<input type="hidden" name="parentId" value={sandbox.id} />
		<input type="hidden" name="parentType" value="SANDBOX" />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Graph name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<div class="mt-2 flex items-center justify-between gap-1">
			<Form.FormError class="w-full text-right" {form} />
			<Button
				variant="outline"
				onclick={() =>
					form.reset({
						newState: {
							name: '',
							parentId: sandbox.id,
							parentType: 'SANDBOX'
						}
					})}
			>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={$submitting} loading={$delayed}>
				<Plus /> Create
				{#snippet loadingMessage()}
					<span>Creating graph...</span>
				{/snippet}
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
