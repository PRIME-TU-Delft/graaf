<script>
	import { page } from '$app/state';
	import { getGraph } from '../../graph.remote';
	import Domain from './Domain.svelte';

	const graphId = Number(page.params.graphid);
</script>

<Domain graphValidator={await getGraph(graphId)} />
