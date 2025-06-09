<script lang="ts">
	import { editLinkSchema } from '$lib/zod/linkSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import * as Form from '$lib/components/ui/form';
	import * as Popover from '$lib/components/ui/popover';
	import { buttonVariants } from '$lib/components/ui/button';

	// Icons
	import { Trash2 } from '@lucide/svelte';

	// Types
	import type { Graph, Link } from '@prisma/client';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	type GraphLinksProps = {
		graph: Graph;
		link: Link;
		editLinkForm: SuperValidated<Infer<typeof editLinkSchema>>;
		onSuccess?: () => void;
	};

	const { graph, link, editLinkForm, onSuccess = () => {} }: GraphLinksProps = $props();

	const id = $props.id();
	const parentType = graph.parentType;
	const parentId = (graph.parentType === 'COURSE' ? graph.courseId : graph.sandboxId) as number;

	const form = superForm(editLinkForm, {
		id: 'delete-graph-link-' + id,
		validators: zodClient(editLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully deleted link!');

				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentType = parentType;
		$formData.parentId = parentId;
		$formData.linkId = link.id;
	});
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ variant: 'destructive' })}>
		<Trash2 />
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/delete-link" method="POST" use:enhance>
			<input type="text" name="graphId" value={graph.id} hidden />
			<input type="text" name="parentId" value={parentId} hidden />
			<input type="text" name="parentType" value={parentType} hidden />
			<input type="text" name="linkId" value={link.id} hidden />

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
					Yes, delete link
				</Form.FormButton>
			</div>
		</form>
	</Popover.Content>
</Popover.Root>
