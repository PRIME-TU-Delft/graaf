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

	// Effect 1: reinitialise D3 whenever data-related props change (payload, editable,
	// lectureID, d3Canvas). View is read via untrack so navigation never triggers a
	// full reinit — only Effect 2 handles that.
	$effect(() => {
		graphD3Store.setGraphD3(
			d3Canvas,
			payload,
			editable,
			untrack(() => view) ?? 'DOMAINS',
			lectureID
		);
	});

	// Effect 2: transition between views when the user navigates.
	// Both `view` and `graphView.state` are tracked so the effect re-runs when the
	// D3 animation callback eventually updates graphView.state (fixes the race where
	// setView is called before the prior animation has finished updating graphView.state).
	$effect(() => {
		const targetView = view;
		const currentView = graphView.state; // tracked — re-runs when animation callback fires
		untrack(() => {
			if (graphD3Store.graphD3 && currentView !== targetView) {
				graphD3Store.graphD3.setView(targetView ?? 'DOMAINS');
			}
		});
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
