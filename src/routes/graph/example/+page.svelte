<script lang="ts">
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { page } from '$app/state';

	let { data } = $props();

	let lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	let view = $derived.by(() => {
		const param = page.url.searchParams.get('view')?.toUpperCase();
		if (param && ['DOMAINS', 'SUBJECTS', 'LECTURES'].includes(param))
			return param as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		return 'DOMAINS';
	});
</script>

<svelte:head>
	<title>{data.graph.name} | PRIME Graph Editor</title>
</svelte:head>

<div class="h-screen w-full bg-slate-50">
	<GraphRenderer data={data.graph} editable={false} builtInViewDropdown={true} {view} {lectureID} />
</div>
