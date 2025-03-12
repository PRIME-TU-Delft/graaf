<script lang="ts">
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';

	let { graph } = $props();
</script>

<div class="sticky top-16 h-[75dvh] w-full rounded-xl bg-blue-200/50 p-4">
	<GraphRenderer data={graph} editable={true} />
</div>
