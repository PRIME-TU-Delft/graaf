<script lang="ts">
	import { untrack } from 'svelte';

	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { page } from '$app/state';
	import { setGraphStore } from '$lib/graph/graphStore.svelte';

	let { data } = $props();

	// Same as the public viewer: the canvas reads its graph from the store, so every route that
	// renders a graph sets one up the same way.
	// Intentionally the initial value: the effect below picks up every later payload
	// svelte-ignore state_referenced_locally
	const store = setGraphStore(data.graph);
	$effect(() => {
		const payload = data.graph;

		untrack(() => store.hydrate(payload));
	});

	let lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	let view = $derived.by(() => {
		const param = page.url.searchParams.get('view')?.toUpperCase();
		if (param && ['DOMAINS', 'SUBJECTS', 'LECTURES'].includes(param))
			return param as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		return 'DOMAINS';
	});
</script>

<svelte:head>
	<title>{store.name} | PRIME Graph Editor</title>
</svelte:head>

<div class="h-screen w-full bg-slate-50">
	<GraphRenderer editable={false} builtInViewDropdown={true} {view} {lectureID} />
</div>
