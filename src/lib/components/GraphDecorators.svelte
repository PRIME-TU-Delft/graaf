<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import { GraphD3 } from '$lib/d3/GraphD3';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import * as settings from '$lib/settings';
	import ZoomIn from 'lucide-svelte/icons/zoom-in';
	import ZoomOut from 'lucide-svelte/icons/zoom-out';
	import { fade } from 'svelte/transition';
	import { Button } from './ui/button';
	import { Maximize, Minimize } from '@lucide/svelte';
	import screenfull from 'screenfull';

	let { graphD3 }: { graphD3: GraphD3 } = $props();

	let isFullscreen = $state(false); // Is the scene fullscreen?

	$effect(() => {
		if (screenfull.isEnabled) {
			screenfull.on('change', () => {
				isFullscreen = screenfull.isFullscreen;
			});
		}
	});

	function toggleFullscreen() {
		if (!screenfull.isEnabled || !document) return;

		const svgParent = graphD3.svg.node()?.parentElement?.parentElement;

		if (!svgParent) {
			console.error('SVG parent element not found');
			return;
		}

		screenfull.toggle(svgParent);
	}
</script>

{#if !graphView.isDomains() && graphD3.data.domain_nodes.length > 0}
	<Accordion.Root
		type="single"
		class="absolute right-4 top-4 rounded-xl border-b-0 bg-white/90 p-3"
	>
		<Accordion.Item class="border-none" value="item-1">
			<Accordion.Trigger class="p-0">Domain Legend</Accordion.Trigger>
			<Accordion.Content>
				{#each graphD3.data.domain_nodes as domain (domain.id)}
					<div class="flex w-full items-center justify-between gap-1">
						<div
							class="size-4"
							style:background={domain.style == null ? '#ffffff' : settings.COLORS[domain.style]}
						></div>
						<span> {domain.text} </span>
					</div>
				{/each}
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
{/if}

{#if !graphView.isLectures()}
	<div
		class="absolute bottom-1 right-1 flex flex-col gap-1"
		transition:fade={{ duration: settings.GRAPH_ANIMATION_DURATION }}
	>
		<Button class="size-8 rounded-xl" onclick={() => graphD3.zoomIn()} size="icon">
			<ZoomIn />
		</Button>
		<Button class="size-8 rounded-xl" onclick={() => graphD3.zoomOut()} size="icon">
			<ZoomOut />
		</Button>

		{#if screenfull.isEnabled && document}
			<Button class="size-8 rounded-xl" onclick={toggleFullscreen}>
				{#if isFullscreen}
					<Minimize class="h-5 w-5" />
				{:else}
					<Maximize class="h-5 w-5" />
				{/if}
			</Button>
		{/if}
	</div>
{/if}
