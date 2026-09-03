<script lang="ts">
	import { untrack } from 'svelte';

	import { graphD3Store } from '$lib/d3/graphD3.svelte';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import { getGraphStore } from '$lib/graph/graphStore.svelte';
	import GraphDecorators from './GraphDecorators.svelte';

	import { nodePositionsSchema } from '$lib/zod/graphSchema';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';

	import type { SavePositions } from '$lib/d3/types';

	type Props = {
		editable: boolean;
		view?: 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		lectureID: number | null;
		builtInViewDropdown?: boolean;
	};

	let { editable, view = 'DOMAINS', lectureID, builtInViewDropdown = false }: Props = $props();

	// The graph itself comes from the store rather than a prop: it owns the data both this canvas
	// and the editor tables render, and pushes the canvas a new projection whenever it changes.
	const store = getGraphStore();
	let d3Canvas: SVGSVGElement;

	// Dragging a node persists its position through the `update-node-positions` action that every
	// child page of the graph editor spreads in. Posting without invalidating is deliberate: the
	// store has already recorded the move, so a refetch would only hand the canvas back the
	// positions it just reported.
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

		// The store owns the rows these positions belong to, so it hears about the move first
		store.recordPositions(domains, subjects);

		$positionsData = { graphId: store.id, domains, subjects };
		submitPositions();
	};

	// Every call into the canvas is untracked. The D3 layer reads the graphState/graphView
	// singletons internally, and those reads would otherwise become dependencies of these effects,
	// re-running them on every animation frame of a transition.

	// The canvas is mounted once for this <svg> and kept up to date by the store, so there is no
	// rebuild-on-data-change effect and nothing to guard against re-running.
	$effect(() => {
		const canvas = untrack(() =>
			graphD3Store.mount(d3Canvas, store, {
				editable,
				view,
				lectureID,
				savePositions: editable ? savePositions : undefined
			})
		);

		return () => untrack(() => graphD3Store.unmount(canvas, store));
	});

	// `graphView.state` is tracked on purpose here. `setView` no-ops while a transition is running,
	// and the transition only reports its new view when its animation callback fires, so tracking
	// that is what lets a view change requested mid-transition catch up instead of being dropped
	// (switch Domains -> Subjects -> Domains quickly and the last one would otherwise be lost).
	$effect(() => {
		const target = view;
		const current = graphView.state;

		untrack(() => {
			if (current !== target) graphD3Store.graphD3?.setView(target);
		});
	});

	$effect(() => {
		const target = lectureID;

		untrack(() => graphD3Store.graphD3?.setLectureById(target));
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
