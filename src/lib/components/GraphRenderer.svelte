<script lang="ts">
	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import GraphDecorators from './GraphDecorators.svelte';

	import { nodePositionsSchema } from '$lib/zod/graphSchema';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	import type { PrismaGraphPayload, SavePositions } from '$lib/d3/types';
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

	// Dragging a node persists its position through the `update-node-positions` action that every
	// child page of the graph editor spreads in. Posting without invalidating is deliberate: the
	// canvas already shows the node where it was dropped, and a refetch would tear the canvas
	// down and rebuild it (Effect 1) right after every drag.
	const positionsForm = superForm(
		defaults({ graphId: 0, domains: [], subjects: [] }, zodClient(nodePositionsSchema)),
		{
			id: 'node-positions',
			dataType: 'json',
			invalidateAll: false,
			applyAction: false,
			resetForm: false,
			onUpdated: ({ form }) => {
				if (!form.valid) toast.error('Failed to save node positions', { duration: 2000 });
			},
			onError: () => toast.error('Failed to save node positions', { duration: 2000 })
		}
	);
	const { form: positionsData, enhance: positionsEnhance, submit: submitPositions } = positionsForm;

	const savePositions: SavePositions = (domains, subjects) => {
		if (domains.length === 0 && subjects.length === 0) return;

		$positionsData = { graphId: payload.id, domains, subjects };
		submitPositions();
	};

	// What the currently mounted canvas was built from, so Effect 1 can tell a real data change
	// from an effect re-run that carries the same values.
	let mountedFrom: {
		canvas: SVGSVGElement;
		payload: PrismaGraphPayload;
		editable: boolean;
		lectureID: number | null;
	} | null = null;

	// Effect 1: rebuild the canvas when the data behind it changes (payload, editable, lectureID,
	// d3Canvas). `view` is read untracked, so navigating between views never lands here — that is
	// Effect 2's job. Rebuilding throws away the camera and any running simulation, so it is
	// guarded on the values actually differing rather than on the effect having re-run: Svelte
	// re-runs this on navigation even when every one of those values is identical.
	$effect(() => {
		const next = { canvas: d3Canvas, payload, editable, lectureID };

		untrack(() => {
			if (
				mountedFrom &&
				mountedFrom.canvas === next.canvas &&
				mountedFrom.payload === next.payload &&
				mountedFrom.editable === next.editable &&
				mountedFrom.lectureID === next.lectureID
			) {
				return;
			}

			mountedFrom = next;
			graphD3Store.setGraphD3(
				d3Canvas,
				payload,
				editable,
				view ?? 'DOMAINS',
				lectureID,
				editable ? savePositions : undefined
			);
		});
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

{#if editable}
	<form method="POST" action="?/update-node-positions" use:positionsEnhance hidden></form>
{/if}

<div
	class="relative flex h-full w-full items-center justify-center overflow-hidden rounded-sm bg-white"
>
	<svg class="block h-full w-full" bind:this={d3Canvas} />

	{#if graphD3Store.graphD3}
		<GraphDecorators graphD3={graphD3Store.graphD3} {editable} {builtInViewDropdown} />
	{/if}
</div>
