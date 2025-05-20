<script lang="ts">
	import { page } from '$app/state';
	import { newLinkSchema } from '$lib/zod/linkSchema';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { fade } from 'svelte/transition';
	import { fromStore } from 'svelte/store';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input';

	// Icons
	import { Plus } from '@lucide/svelte';

	// Types
	import type { Prisma } from '@prisma/client';
	import type { PageData } from '../$types';

	type AddAliasLinkProps = {
		graph: Prisma.GraphGetPayload<{
			include: {
				links: true;
			};
		}>;
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

	let duplicateLinkName = $derived.by(() => {
		const { name } = fromStore(formData).current;
		return graph.links.some(link => link.name === name);
	});

	$effect(() => {
		$formData.name = '';
		$formData.graphId = graph.id;
		$formData.parentId = data.sandbox.id;
		$formData.parentType = 'SANDBOX';
	});

</script>

<form class="flex flex-col" action="?/new-link" method="POST" use:enhance>
	<input type="hidden" name="graphId" value={graph.id} />
	<input type="hidden" name="parentId" value={data.sandbox.id} />
	<input type="hidden" name="parentType" value="SANDBOX" />

	<div class="flex flex-row gap-2">
		<Form.Field {form} name="name" class="grow">
			<Form.Control>
				{#snippet children({ props })}
					<Input {...props} placeholder="Link name" bind:value={$formData.name} />
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.FormButton disabled={$submitting} loading={$delayed} loadingMessage="Adding link...">
			<Plus /> Add link
		</Form.FormButton>
	</div>

	{#if duplicateLinkName}
		<div
			in:fade={{ duration: 200 }}
			class="mt-2 rounded border-2 border-amber-700 bg-amber-50 p-2 text-sm text-amber-700"
		>
			<h3 class="font-bold">Warning</h3>
			This graph already has a link with the same name. This may cause
			confusion.
		</div>
	{/if}

	<Form.FormError {form} />
</form>
