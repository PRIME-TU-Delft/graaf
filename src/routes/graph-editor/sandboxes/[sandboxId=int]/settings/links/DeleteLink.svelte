<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { editLinkSchema } from '$lib/zod/linkSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	
	// Icons
	import { Trash } from '@lucide/svelte';

	// Types
	import type { Sandbox, Graph, Link } from '@prisma/client';
	import type { PageData } from '../$types';

	type DeleteAliasLinkProps = {
		sandbox: Sandbox;
		graph: Graph;
		link: Link;
		onSuccess: () => void;
	};

	const { sandbox, graph, link, onSuccess }: DeleteAliasLinkProps = $props();

	const id = $props.id();
	const data = page.data as PageData;
	const form = superForm(data.editLinkForm, {
		id: 'delete-link-' + id,
		validators: zodClient(editLinkSchema),
		onResult: ({ result }) => {
			console.log({ result });
			if (result.type == 'success') {
				toast.success('Succesfully deleted link!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = sandbox.id;
		$formData.parentType = 'SANDBOX';
		$formData.linkId = link.id;
	});
</script>

<Popover.Root>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
		<Trash />
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/delete-link" method="POST" use:enhance>
			<input type="text" name="graphId" value={graph.id} hidden />
			<input type="text" name="parentId" value={sandbox.id} hidden />
			<input type="text" name="parentType" value="SANDBOX" hidden />
			<input type="text" name="linkId" value={link.id} hidden />

			<div class="grid grid-cols-2 items-center justify-between gap-1">
				<p class="text-nowrap font-bold">Are you sure?</p>
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
