<script>
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { page } from '$app/state';

	let { data } = $props();
	const lectureID = Number(page.url.searchParams.get('lectureID')) || null;
</script>

<div class="sticky h-[calc(100dvh)] w-full rounded-lg bg-purple-200/50 p-2">
	<GraphRenderer data={data.graph} editable={false} {lectureID} />
</div>
