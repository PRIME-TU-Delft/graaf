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
	
	// Icons
	import { EyeOff } from '@lucide/svelte';

	// Types
	import type { SandboxPermissions } from '$lib/utils/permissions';
	import type { Sandbox, Graph, Lecture, Link } from '@prisma/client';
	import type { PageData } from '../$types';

	type GraphLinkSettingsProps = {
		sandbox: Sandbox & SandboxPermissions & { links: Link[] };
		graph: Graph & {
			lectures: Lecture[];
			links: Link[];
		};
		graphs: Graph[];
		onSuccess: () => void;
	};

	const { sandbox, graph, graphs, onSuccess }: GraphLinkSettingsProps = $props();

	const id = $props.id();
	const data = page.data as PageData;
	const form = superForm(data.editGraphForm, {
		id: 'edit-graph-' + id,
		validators: zodClient(graphSchemaWithId),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Succesfully changed graph!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance } = form;

	$effect(() => {
		$formData.graphId = graph.id;
		$formData.parentId = sandbox.id;
		$formData.parentType = 'SANDBOX';
		$formData.name = graph.name;
	});
</script>

<form action="?/edit-graph" method="POST" use:enhance>
	<input type="text" name="graphId" value={graph.id} hidden />
	<input type="text" name="parentId" value={sandbox.id} hidden />
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

				{#if graphs.length > 1}
					<MoveLink {sandbox} {graph} {graphs} {link} {onSuccess} />
				{/if}

				<DeleteLink {sandbox} {graph} {link} {onSuccess} />
			</div>
		{/each}
	</div>

	<AddLink {sandbox} {graph} {onSuccess} />
</form>
