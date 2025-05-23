<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { newGraphSchema } from '$lib/zod/graphSchema';
	import { page } from '$app/state';

	import type { PageData } from './$types';

	let dialogOpen = $state(false);

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
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="plus"
	button="New Graph"
	title="Create Graph"
	description="Graphs are collections of Nodes and Edges, usually pertaining to the same field of study."
	class="w-full "
>
	<form action="?/new-graph" method="POST" use:enhance>
		<input type="hidden" name="parentId" value={data.course?.id} />
		<input type="hidden" name="parentType" value="COURSE" />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Graph name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.Description>A common name for the graph</Form.Description>
			<Form.FieldErrors />
		</Form.Field>

		<div class="mt-4 flex w-full justify-end">
			<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Creating graph...">
				Create new graph
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
