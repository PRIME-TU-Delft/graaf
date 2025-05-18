<script lang="ts">
	import { page } from '$app/state';
	import { graphSchemaWithId } from '$lib/zod/graphSchema';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	
	// Components
	import AddLink from './AddLink.svelte';
	import DeleteLink from './DeleteLink.svelte';
	import MoveLink from './MoveLink.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';
	
	// Icons
	import { EyeOff } from '@lucide/svelte';

	// Types
	import type { Graph, Lecture, Link } from '@prisma/client';
	import type { PageData } from '../$types';

	type GraphLinkSettingsProps = {
		graph: Graph & { lectures: Lecture[]; links: Link[] };
	};

	const { graph }: GraphLinkSettingsProps = $props();

	const data = page.data as PageData;

	// On success callback
	let graphLinkSettingsOpen = $state(false);

	// Build the form
	const id = $props.id();
	const form = superForm(data.editGraphForm, {
		id: 'edit-graph-' + id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully changed links!');
				graphLinkSettingsOpen = false;
			}
		}
	});

	const { form: formData, enhance } = form;

	// Svelte stuff
	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = data.sandbox.id;
		$formData.parentType = 'SANDBOX';
		$formData.name = graph.name;
	});

</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	class="grow"
	icon="link"
	button="Link Settings"
	title="Link Settings"
	onclick={event => {
		event.preventDefault();
		graphLinkSettingsOpen = true;
	}}
>
	<form action="?/edit-graph" method="POST" use:enhance>
	<input type="text" name="graphId" value={graph.id} hidden />
	<input type="text" name="parentId" value={data.sandbox.id} hidden />
	<input type="text" name="parentType" value="SANDBOX" hidden />
		
	<p class="text-sm">
		You can create links to your graphs that can be shared with others. 
		Graphs can have multiple links. Toggle link visibility by clicking the 
		<EyeOff class="border-sm inline size-6 rounded bg-blue-100 p-1" /> icon.
	</p>

	<div class="my-2 grid grid-cols-1 gap-x-4 gap-y-2">
		{#each graph.links as link (link.id)}
			<div in:fade class="flex w-full items-center justify-between gap-1">
				<p class="w-full rounded border border-blue-100 bg-blue-50/50 p-2">{link.name}</p>

				{#if data.sandbox.graphs.length > 1}
					<MoveLink {graph} {link} />
				{/if}

				<DeleteLink {graph} {link} />
			</div>
		{/each}
	</div>

	<AddLink {graph} />
</form>

</DialogButton>