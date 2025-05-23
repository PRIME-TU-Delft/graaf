<script>
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';

	let { data } = $props();
</script>

<div class="sticky h-[calc(100dvh)] w-full rounded-lg bg-purple-200/50 p-2">
	<GraphRenderer data={data.graph} editable={false} />
</div>
