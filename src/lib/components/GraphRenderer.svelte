<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { GraphD3, GraphView } from '$lib/d3/GraphD3';
	import type { PrismaGraphPayload } from '$lib/d3/types';
	import * as settings from '$lib/settings';
	import ZoomIn from 'lucide-svelte/icons/zoom-in';
	import ZoomOut from 'lucide-svelte/icons/zoom-out';
	import { fade } from 'svelte/transition';

	let { data, editable }: { data: PrismaGraphPayload; editable: boolean } = $props();

	const graphD3 = new GraphD3(data, editable);
</script>

<!-- Markup -->

<div class="relative h-full w-full overflow-hidden rounded-sm">
	<svg class="block h-full w-full" use:graphD3.attach />

	{#if graphD3.view == GraphView.domains && graphD3.graph_data.domain_nodes.length > 0}
		<Accordion.Root
			type="single"
			class="absolute right-4 top-4 rounded-xl border-b-0 bg-white/90 p-3"
		>
			<Accordion.Item class="border-none" value="item-1">
				<Accordion.Trigger class="p-0">Domain Legend</Accordion.Trigger>
				<Accordion.Content>
					{#each graphD3.graph_data.domain_nodes as domain}
						<div class="flex w-full items-center justify-between gap-1">
							<div class="size-4" style:background={settings.COLORS[domain.style]}></div>
							<span> {domain.text} </span>
						</div>
					{/each}
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	{/if}

	{#if graphD3.view !== GraphView.lectures}
		<div
			class="absolute bottom-3 right-3 flex flex-col gap-2"
			transition:fade={{ duration: settings.GRAPH_ANIMATION_DURATION }}
		>
			<button
				class="size-7 scale-100 rounded-full p-1 ring-blue-800 transition-transform hover:scale-110 focus:ring-1"
				onclick={() => graphD3.zoomIn()}
			>
				<ZoomIn />
			</button>
			<button
				class="size-7 scale-100 rounded-full p-1 ring-blue-800 transition-transform hover:scale-110 focus:ring-1"
				onclick={() => graphD3.zoomOut()}
			>
				<ZoomOut />
			</button>
		</div>
	{/if}
</div>
