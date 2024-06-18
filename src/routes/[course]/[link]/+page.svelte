
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Components
	import GraphInterface from '$components/GraphInterface.svelte'

	// Exports
	export let data: PageData

	// Variables
	let { graph } = data

</script>


<!-- Markup -->


<GraphInterface graph={graph} interactive={false} />