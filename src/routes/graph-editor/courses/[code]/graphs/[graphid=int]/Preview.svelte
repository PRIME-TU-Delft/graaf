<script lang="ts">
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import type { PrismaGraphPayload } from '$lib/d3/types';

	let { graph }: { graph: PrismaGraphPayload } = $props();
</script>

<div class="sticky top-20 h-[calc(100dvh-8rem)] w-full rounded-xl bg-purple-200/50 p-4">
	{#key graph}
		<GraphRenderer data={graph} editable={true} />
	{/key}
</div>
