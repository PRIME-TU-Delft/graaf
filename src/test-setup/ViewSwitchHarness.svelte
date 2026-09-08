<script lang="ts">
	// Mirrors the `view`/`lectureID` derivation in src/routes/graph/example/+page.svelte: the
	// real app derives these from the URL and hands them down as props, GraphRenderer never reads
	// the URL itself. Component tests reproduce that wiring here so the view-switch race between
	// GraphDecorators' dropdown and GraphRenderer's reactive effect is exercised for real.
	import GraphRenderer from '$lib/components/GraphRenderer.svelte';
	import { page } from '$app/state';
	import type { PrismaGraphPayload } from '$lib/d3/types';

	type Props = { data: PrismaGraphPayload };

	let { data }: Props = $props();

	let lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	let view = $derived.by(() => {
		const param = page.url.searchParams.get('view')?.toUpperCase();
		if (param && ['DOMAINS', 'SUBJECTS', 'LECTURES'].includes(param))
			return param as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		return 'DOMAINS';
	});
</script>

<GraphRenderer {data} editable={false} builtInViewDropdown={true} {view} {lectureID} />
