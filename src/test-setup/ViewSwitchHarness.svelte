<script lang="ts">
	// Mirrors src/routes/graph/example/+page.svelte: the route puts the loaded graph in the graph
	// store and derives `view`/`lectureID` from the URL, handing those down as props. GraphRenderer
	// reads the graph from the store and never reads the URL itself. Component tests reproduce that
	// wiring here so the view-switch race between GraphDecorators' dropdown and GraphRenderer's
	// reactive effect is exercised for real.
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { page } from '$app/state';
	import { setGraphStore } from '$lib/graph/graphStore.svelte';
	import type { RenderableGraph } from '$lib/graph/renderablePayload';

	type Props = { data: RenderableGraph };

	let { data }: Props = $props();

	setGraphStore(() => data);

	let lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	let view = $derived.by(() => {
		const param = page.url.searchParams.get('view')?.toUpperCase();
		if (param && ['DOMAINS', 'SUBJECTS', 'LECTURES'].includes(param))
			return param as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		return 'DOMAINS';
	});
</script>

<GraphRenderer editable={false} builtInViewDropdown={true} {view} {lectureID} />
