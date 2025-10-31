<script>
	import { page } from '$app/state';
	import { getGraph } from '../../graph.remote';
	import Subject from './Subject.svelte';

	const graphId = Number(page.params.graphid);
</script>

<Subject graphValidator={await getGraph(graphId)} />
