<script lang="ts">
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import GraphDecorators from './GraphDecorators.svelte';

	import type { PrismaGraphPayload } from '$lib/d3/types';
	import { untrack } from 'svelte';

	type Props = {
		data: PrismaGraphPayload;
		editable: boolean;
		view?: 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		lectureID: number | null;
		builtInViewDropdown?: boolean;
	};

	let { data: payload, editable, view, lectureID, builtInViewDropdown = false }: Props = $props();
	let d3Canvas: SVGSVGElement;

	$effect(() => {
		// Read graphView.state via untrack so that setView() updating it doesn't
		// re-trigger this effect and cause a spurious full reinitialisation.
		if (view != untrack(() => graphView.state)) {
			if (view === undefined) view = 'DOMAINS';
			graphD3Store.graphD3?.setView(view);
		} else {
			graphD3Store.setGraphD3(d3Canvas, payload, editable, view, lectureID);
		}
	});
</script>

<!-- Markup -->

<div
	class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm bg-white"
>
	<svg class="block h-full w-full" bind:this={d3Canvas} />

	{#if graphD3Store.graphD3}
		<GraphDecorators graphD3={graphD3Store.graphD3} {editable} {builtInViewDropdown} />
	{/if}
</div>
