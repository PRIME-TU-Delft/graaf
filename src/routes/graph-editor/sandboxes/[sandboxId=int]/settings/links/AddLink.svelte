<script lang="ts">
	import { page } from '$app/state';
	import { newLinkSchema } from '$lib/zod/linkSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';

	// Icons
	import { Plus } from '@lucide/svelte';

	// Types
	import type { Graph, Link } from '@prisma/client';
	import type { PageData } from '../$types';

	type AddAliasLinkProps = {
		graph: Graph;
	};

	let { graph }: AddAliasLinkProps = $props();

	const id = $props.id();
	const data = page.data as PageData;
	const form = superForm(data.newLinkForm, {
		id: 'new-link-' + id,
		validators: zodClient(newLinkSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully added link!');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = data.sandbox.id;
		$formData.parentType = 'SANDBOX';
	});

	const linkDuplicate = $derived(data.sandbox.links.find((link) => link.name == $formData.name));
	const linkInvalidCharacters = $derived.by(() => {
		return $formData.name.match(/^[a-zA-Z0-9-]+$/) == null;
	});
</script>

<form class="flex flex-col gap-2" action="?/new-link" method="POST" use:enhance>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="parentId" value={data.sandbox.id} />
	<input type="hidden" name="parentType" value="SANDBOX" />

	<div class="grow flex flex-row gap-2 items-center">
		<Form.Field {form} name="name" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<Input class="grow" {...props} placeholder="Link name" bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
		</Form.Field>

		<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Adding link...">
			<Plus /> Add link
		</Form.FormButton>
	</div>

	{#if linkDuplicate}
		<p class="text-red-500">Link with this name already exists</p>
	{:else if linkInvalidCharacters && $formData.name.length > 0}
		<p class="text-red-500">Only allowed to contain letters, numbers, and `-`</p>
	{/if}

	<Form.FormError class="text-right" {form} />
</form>
