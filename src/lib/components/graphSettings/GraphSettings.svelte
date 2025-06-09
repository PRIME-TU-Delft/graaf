<script lang="ts">
	import { graphSchemaWithId } from '$lib/zod/graphSchema';
	import { Undo2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import { Button } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import DeleteGraph from '$lib/components/graphSettings/DeleteGraph.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	// Types
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import type { Graph } from '@prisma/client';

	type GraphLinksProps = {
		graph: Graph;
		canDelete: boolean;
		editGraphForm: SuperValidated<Infer<typeof graphSchemaWithId>>;
	};

	const { graph, canDelete, editGraphForm }: GraphLinksProps = $props();

	const id = $props.id();
	const parentType = graph.parentType;
	const parentId = (parentType === 'COURSE' ? graph.courseId : graph.sandboxId) as number;

	let graphSettingsOpen = $state(false);

	const form = superForm(editGraphForm, {
		id: 'change-graph-' + id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully changed graph!');

				graphSettingsOpen = false;
			}
		}
	});

	const { form: formData, enhance: formEnhance, submitting, delayed } = form;

	function resetForm() {
		$formData.graphId = graph.id;
		$formData.parentId = parentId;
		$formData.parentType = parentType;
		$formData.name = graph.name;
	}

	const hasChanges = $derived.by(() => {
		return $formData.name !== graph.name;
	});

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = parentId;
		$formData.parentType = parentType;
		$formData.name = graph.name;
	});
</script>

<DialogButton
	bind:open={graphSettingsOpen}
	onclick={(e) => {
		e.preventDefault();
		e.stopPropagation();
		graphSettingsOpen = true;
	}}
	icon="edit"
	button="Graph settings"
	title="Graph settings"
	class="grow"
>
	<form action="?/edit-graph" method="POST" use:formEnhance>
		<input type="text" name="graphId" value={graph.id} hidden />
		<input type="text" name="parentId" value={parentId} hidden />
		<input type="text" name="parentType" value={parentType} hidden />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Graph name</Form.Label>
					<Input {...props} bind:value={$formData['name']} />
				{/snippet}
			</Form.Control>
			<Form.Description />
			<Form.FieldErrors />
		</Form.Field>

		<div class="flex items-center justify-between gap-1">
			<Form.FormError class="w-full text-right" {form} />

			{#if canDelete}
				<DeleteGraph {graph} {editGraphForm} onSuccess={() => (graphSettingsOpen = false)} />
			{/if}

			<Button variant="outline" disabled={!hasChanges || $submitting} onclick={resetForm}>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={!hasChanges || $submitting} loading={$delayed}>
				Change graph
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
