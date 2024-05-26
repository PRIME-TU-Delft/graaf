
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Lib imports
	import { GraphSVG, GraphType } from '$scripts/graph/graphSVG'

	// Components
	import DefaultLayout from '$layouts/DefaultLayout.svelte'
	import Graph from '$components/Graph.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'
	import LinkButton from '$components/LinkButton.svelte'

	// Exports
	export let data: PageData

	// Variables
	let { course, graph } = data
	let graphSVG: GraphSVG = new GraphSVG(graph, GraphType.domains, true)
	let activeTab: number = 0

</script>



<!-- Markup -->



<DefaultLayout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: "Dashboard",
			href: "/dashboard"
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/course/${course.code}/overview`
		},
		{
			name: graph.name,
			href: `/course/${course.code}/graph/${graph.id}/overview`
		},
		{
			name: "Edit",
			href: `/course/${course.code}/graph/${graph.id}/edit`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<div class="flex-spacer" />
		<LinkButton href={`/course/${course.code}/graph/${graph.id}/settings`}> Settings </LinkButton>
		<Button on:click={() => graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>
	</svelte:fragment>

	<Graph {graph} />
	
</DefaultLayout>
