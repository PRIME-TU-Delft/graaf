<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { graphSchemaWithId } from '$lib/zod/graphSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';

	// Types
	import type { Graph } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	type GraphLinksProps = {
		graph: Graph;
		editGraphForm: SuperValidated<Infer<typeof graphSchemaWithId>>;
		onSuccess?: () => void;
	};

	const { graph, editGraphForm, onSuccess = () => {} }: GraphLinksProps = $props();

	const id = $props.id();
	const parentType = graph.parentType;
	const parentId = (parentType === 'COURSE' ? graph.courseId : graph.sandboxId) as number;

	const form = superForm(editGraphForm, {
		id: 'delete-graph-' + id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully deleted graph!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = parentId;
		$formData.parentType = parentType;
		$formData.name = graph.name;
	});
</script>

<Popover.Root>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
		Delete graph
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/delete-graph" method="POST" use:enhance>
			<input type="text" name="graphId" value={graph.id} hidden />
			<input type="text" name="parentId" value={parentId} hidden />
			<input type="text" name="parentType" value={parentType} hidden />
			<input type="text" name="name" value={graph.name} hidden />

			<div class="grid grid-cols-2 items-center justify-between gap-1">
				<p class="font-bold text-nowrap">Are you sure?</p>

				<Form.FormError class="w-full text-right" {form} />

				<p class="text-sm text-gray-500">This cannot be undone</p>

				<Form.FormButton
					variant="destructive"
					disabled={$submitting}
					loading={$delayed}
					loadingMessage="Deleting..."
				>
					Delete
				</Form.FormButton>
			</div>
		</form>
	</Popover.Content>
</Popover.Root>
