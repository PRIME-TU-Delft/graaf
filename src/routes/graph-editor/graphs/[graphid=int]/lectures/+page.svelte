<script>
	import { page } from '$app/state';
	import { getGraph } from '../../graph.remote';
	import Lectures from './Lectures.svelte';

	const graphId = Number(page.params.graphid);
</script>

<Lectures graphValidator={await getGraph(graphId)} />
