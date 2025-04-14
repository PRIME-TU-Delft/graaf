<script lang="ts">
	import { cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';

	// Components
	import Button from '$lib/components/ui/button/button.svelte';
	import CreateNewGraphButton from './CreateNewGraphButton.svelte';
	import GraphTile from './GraphTile.svelte';
	
	// Icons
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	// Types
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto p-4 text-blue-900">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else}
		<div class="flex justify-between">
			<h1 class="shadow-blue-500/70">{data.sandbox.name} - {displayName(data.sandbox.owner)}</h1>

			{#if data.user != undefined && data.user.id == data.sandbox.ownerId}
				<Button href="{data.sandbox.id}/settings">Settings <ArrowRight /></Button>
			{/if}
		</div>
		<p>
			This is where you can find all the information about the sandbox. You can also create a new
			graph here.
		</p>
	{/if}
</section>

{#if data.sandbox != null}
	<section
		class={cn([
			'mx-auto my-12 grid max-w-4xl gap-4 p-4',
			data.graphs.length > 0 ? 'grid-cols-1 sm:grid-cols-2' : ''
		])}
	>
		<CreateNewGraphButton />

		{#each data.graphs as graph (graph.id)}
			<GraphTile graph={graph} />
		{/each}
	</section>
{/if}
