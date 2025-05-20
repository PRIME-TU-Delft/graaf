<script lang="ts">
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	
	// Components
	import AddLink from './AddLink.svelte';
	import DeleteLink from './DeleteLink.svelte';
	import MoveLink from './MoveLink.svelte';
	import DialogButton from '$lib/components/DialogButton.svelte';

	// Types
	import type { Prisma } from '@prisma/client';
	import type { PageData } from '../$types';

	type GraphLinkSettingsProps = {
		graph: Prisma.GraphGetPayload<{
			include: {
				links: true;
			};
		}>;
	};

	const { graph }: GraphLinkSettingsProps = $props();

	const data = page.data as PageData;

	// On success callback
	let graphLinkSettingsOpen = $state(false);

</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	class="grow"
	icon="link"
	button="Link Settings"
	title="Link Settings"
	description="
		Manage the links in this graph. Links are used to share graphs with other people.
		People with access to this link with will be able to view the graph, but not edit it.
		Graphs can have multiple links.
	"
	onclick={event => {
		event.preventDefault();
		graphLinkSettingsOpen = true;
	}}
>
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
</DialogButton>