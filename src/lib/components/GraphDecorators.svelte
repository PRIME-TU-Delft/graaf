<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { GraphD3 } from '$lib/d3/GraphD3';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import * as settings from '$lib/settings';
	import ZoomIn from 'lucide-svelte/icons/zoom-in';
	import ZoomOut from 'lucide-svelte/icons/zoom-out';
	import { fade } from 'svelte/transition';

	let { graphD3 }: { graphD3: GraphD3 } = $props();
</script>

{#if graphView.isDomains() && graphD3.data.domain_nodes.length > 0}
	<Accordion.Root
		type="single"
		class="absolute right-4 top-4 rounded-xl border-b-0 bg-white/90 p-3"
	>
		<Accordion.Item class="border-none" value="item-1">
			<Accordion.Trigger class="p-0">Domain Legend</Accordion.Trigger>
			<Accordion.Content>
				{#each graphD3.data.domain_nodes as domain}
					<div class="flex w-full items-center justify-between gap-1">
						<div class="size-4" style:background={settings.COLORS[domain.style]}></div>
						<span> {domain.text} </span>
					</div>
				{/each}
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
{/if}

{#if !graphView.isLectures()}
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
