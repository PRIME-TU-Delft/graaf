<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';
	import { newLinkSchema } from '$lib/zod/linkSchema';
	import type { Sandbox, Graph, Link } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';

	type AddAliasLinkProps = {
		sandbox: Sandbox & {
			links: Link[];
		};
		graph: Graph;
		onSuccess: (link: Link) => void;
	};

	let { sandbox, graph, onSuccess }: AddAliasLinkProps = $props();
	const id = $props.id();

	const form = superForm((page.data as PageData).createLinkForm, {
		id: 'delete-graph-link-' + id,
		validators: zodClient(newLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully added link!');

				console.log({ result });
				onSuccess(result!.data!.link as Link);
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = sandbox.id;
		$formData.parentType = 'SANDBOX';
	});

	const linkDuplicate = $derived(sandbox.links.find((link) => link.name == $formData.name));
	const linkInvalidCharacters = $derived.by(() => {
		return $formData.name.match(/^[a-zA-Z-]+$/) == null;
	});
</script>

<form class="flex items-center gap-2" action="?/add-link" method="POST" use:enhance>
	<input type="text" name="graphId" value={graph.id} hidden />
	<input type="text" name="parentId" value={sandbox.id} hidden />
	<input type="text" name="parentType" value="SANDBOX" hidden />
	
	<Form.FormError class="text-right" {form} />

	{#if linkDuplicate}
		<p class="text-red-500">Link with this name already exists</p>
	{:else if linkInvalidCharacters && $formData.name.length > 0}
		<p class="text-red-500">Only allowed to contain a to Z and `-`</p>
	{/if}

	<Form.Field {form} name="name" class="grow">
		<Form.Control>
			{#snippet children({ props })}
				<Input class="grow" {...props} placeholder="Add an alias" bind:value={$formData.name} />
			{/snippet}
		</Form.Control>
	</Form.Field>

	<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Adding link...">
		Add link
	</Form.FormButton>
</form>
