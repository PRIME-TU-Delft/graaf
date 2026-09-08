<script lang="ts">
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { newLinkSchema } from '$lib/zod/linkSchema';

	// Components
	import { Input } from '$lib/components/ui/input';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Button } from '$lib/components/ui/button';

	// Icons
	import { Plus, Undo2 } from '@lucide/svelte';

	// Types
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import type { Graph } from '@prisma/client';

	type CreateNewGraphButtonProps = {
		graph: Graph;
		newLinkForm: SuperValidated<Infer<typeof newLinkSchema>>;
	};

	let { graph, newLinkForm }: CreateNewGraphButtonProps = $props();

	const parentType = $derived(graph.parentType);
	const parentId = $derived(
		(graph.parentType == 'COURSE' ? graph.courseId : graph.sandboxId) as number
	);

	// svelte-ignore state_referenced_locally
	const form = superForm(newLinkForm, {
		id: 'create-link-' + graph.id,
		validators: zodClient(newLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Link created successfully!');
				dialogOpen = false;
				form.reset({
					newState: {
						name: '',
						graphId: graph.id,
						parentId: parentId,
						parentType: parentType
					}
				});
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	let dialogOpen = $state(false);

	$effect(() => {
		const id = graph.id;
		const pId = parentId;
		const pType = parentType;
		untrack(() => {
			$formData.name = '';
			$formData.graphId = id;
			$formData.parentId = pId;
			$formData.parentType = pType;
		});
	});
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="link"
	button="Link"
	title="Create Link"
	description={parentType === 'SANDBOX'
		? 'Links allow you to share graphs with others. Users with the link can view the graph, but not edit it. This makes the graph publicly viewable to anyone with the link, even though the sandbox itself stays private.'
		: 'Links allow you to share graphs with others. Users with the link can view the graph, but not edit it.'}
>
	<form action="?/new-link" method="POST" use:enhance>
		<input type="hidden" name="graphId" value={graph.id} />
		<input type="hidden" name="parentId" value={parentId} />
		<input type="hidden" name="parentType" value={parentType} />

		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label for="name">Link name</Form.Label>
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
							graphId: graph.id,
							parentId: parentId,
							parentType: parentType
						}
					})}
			>
				<Undo2 /> Reset
			</Button>
			<Form.FormButton disabled={$submitting} loading={$delayed}>
				<Plus /> Create
				{#snippet loadingMessage()}
					<span>Creating link...</span>
				{/snippet}
			</Form.FormButton>
		</div>
	</form>
</DialogButton>
