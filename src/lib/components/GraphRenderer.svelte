<script lang="ts">
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import GraphDecorators from './GraphDecorators.svelte';

	import type { PrismaGraphPayload } from '$lib/d3/types';
	import { untrack } from 'svelte';

	type Props = {
		data: PrismaGraphPayload;
		view: 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		editable: boolean;
		lectureID: number | null;
		builtInViewDropdown?: boolean;
	};

	let { data: payload, view, editable, lectureID, builtInViewDropdown = false }: Props = $props();
	let d3Canvas: SVGSVGElement;

	$effect(() => {
		// TODO apply lecture id change
		if (d3Canvas && payload) {
			untrack(() => {
				graphD3Store.setGraphD3(d3Canvas, payload, editable, view, lectureID);
			});
		}
	});

	$effect(() => {
		graphD3Store.graphD3?.setView(view);
	});
</script>

<!-- Markup -->

<div
	class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm bg-white"
>
	<svg class="block h-full w-full" bind:this={d3Canvas} />

	{#key graphD3Store.graphD3}
		{#if graphD3Store.graphD3}
			<GraphDecorators graphD3={graphD3Store.graphD3} {editable} {builtInViewDropdown} />
		{/if}
	{/key}
</div>
