<script lang="ts">
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import type { PrismaGraphPayload } from '$lib/d3/types';
	import GraphDecorators from './GraphDecorators.svelte';

	let {
		data: payload,
		editable,
		lectureID
	}: { data: PrismaGraphPayload; editable: boolean; lectureID: number | null } = $props();

	let d3Canvas = $state<SVGSVGElement>();

	$effect(() => {
		if (d3Canvas == null) return;
		graphD3Store.setGraphD3(d3Canvas, payload, editable, lectureID);
	});
</script>

<!-- Markup -->

<div
	class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm bg-white"
>
	<svg class="block h-full w-full" bind:this={d3Canvas} />

	{#if graphD3Store.graphD3}
		<GraphDecorators graphD3={graphD3Store.graphD3} {editable} />
	{/if}
</div>
