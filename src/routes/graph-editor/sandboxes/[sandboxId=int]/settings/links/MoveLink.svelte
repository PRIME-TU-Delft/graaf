<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import { editLinkSchema } from '$lib/zod/linkSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	
	// Components
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	
	// Icons
	import { Check, ChevronDown } from '@lucide/svelte';
	
	// Types
	import type { Sandbox, Graph, Link } from '@prisma/client';
	import type { PageData } from '../$types';

	type MoveAliasLinkProps = {
		sandbox: Sandbox;
		graph: Graph;
		graphs: Graph[];
		link: Link;
		onSuccess: () => void;
	};

	const { sandbox, graph, graphs, link, onSuccess }: MoveAliasLinkProps = $props();

	const id = $props.id();
	const data = page.data as PageData;
	const form = superForm(data.editLinkForm, {
		id: 'move-link-' + id,
		validators: zodClient(editLinkSchema),
		onResult: ({ result }) => {
			console.log({ result });
			if (result.type == 'success') {
				toast.success('Succesfully moved link!');
				onSuccess();
			}
		}
	});
	
	const { form: formData, enhance, submitting, delayed } = form;
	
	let graphId = $state(graph.id);
	
	$effect(() => {
		$formData.parentId = sandbox.id;
		$formData.parentType = 'SANDBOX';
		$formData.linkId = link.id;
		$formData.graphId = graphId;
	});
</script>

<Popover.Root>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'outline' }))}>
		Move link to... <ChevronDown />
	</Popover.Trigger>
	<Popover.Content>
		<form action="?/move-link" method="POST" use:enhance>
			<input type="text" name="parentId" value={sandbox.id} hidden />
			<input type="text" name="parentType" value="SANDBOX" hidden />
			<input type="text" name="linkId" value={link.id} hidden />
			<input type="text" name="graphId" value={graphId} hidden />

			{#each graphs as newGraph (newGraph.id)}
				<Form.FormButton
					disabled={$submitting || newGraph.id === graph.id} 
					loading={$delayed} 
					loadingMessage="Deleting..."
					variant="ghost"
					class="w-full justify-between"
					onclick={() => {
						graphId = newGraph.id;
					}}
				>
					{newGraph.name}
					<Check class={cn('ml-auto', newGraph.id !== $formData.graphId && 'text-transparent')} />
				</Form.FormButton>
			{/each}
		</form>
	</Popover.Content>
</Popover.Root>
