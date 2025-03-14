<script lang="ts">
	import { GraphD3 } from '$lib/d3/GraphD3';
	import type { PrismaGraphPayload } from '$lib/d3/types';
	import { onMount } from 'svelte';
	import GraphDecorators from './GraphDecorators.svelte';

	let { data: payload, editable }: { data: PrismaGraphPayload; editable: boolean } = $props();

	let graphD3 = $state<GraphD3>();
	let d3Canvas = $state<SVGSVGElement>();

	onMount(() => {
		if (d3Canvas == null) return;
		graphD3 = new GraphD3(d3Canvas, payload, editable);
	});
</script>

<!-- Markup -->

<div class="relative h-full w-full overflow-hidden rounded-sm">
	<svg class="block h-full w-full" bind:this={d3Canvas} />

	{#if graphD3}
		<GraphDecorators {graphD3} />
	{/if}
</div>
