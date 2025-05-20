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
	import type { Graph, Link } from '@prisma/client';
	import type { PageData } from '../$types';

	type DeleteAliasLinkProps = {
		graph: Graph;
		link: Link;
	};

	const { graph, link }: DeleteAliasLinkProps = $props();

	const id = $props.id();
	const data = page.data as PageData;
	const form = superForm(data.editLinkForm, {
		id: 'delete-link-' + id,
		validators: zodClient(editLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully deleted link!');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = data.sandbox.id;
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
			<input type="hidden" name="graphId" value={graph.id} />
			<input type="hidden" name="parentId" value={data.sandbox.id} />
			<input type="hidden" name="parentType" value="SANDBOX" />
			<input type="hidden" name="linkId" value={link.id} />

			<div class="flex flex-row items-center justify-between">
				<div>
					<h5 class="font-bold">Delete Link</h5>
					<p class="text-sm text-muted-foreground">This cannot be undone.</p>
				</div>
				<Form.FormButton
					variant="destructive"
					disabled={$submitting}
					loading={$delayed}
					loadingMessage="Deleting..."
				>
					Confirm
				</Form.FormButton>
			</div>

			<Form.FormError class="w-full text-right" {form} />
		</form>
	</Popover.Content>
</Popover.Root>
