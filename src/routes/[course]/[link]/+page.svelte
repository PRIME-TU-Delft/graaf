
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Components
	import GraphSVG from '$components/GraphSVG.svelte'

	// Exports
	export let data: PageData

	// Variables
	let { graph } = data

</script>


<!-- Markup -->


<GraphSVG graph={graph} interactive={false} />