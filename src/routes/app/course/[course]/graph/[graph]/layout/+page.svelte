
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Components
	import DefaultLayout from '$layouts/DefaultLayout.svelte'
	import GraphInterface from '$components/GraphInterface.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'
	import LinkButton from '$components/LinkButton.svelte'
	import Validation from '$components/Validation.svelte';
	import { Course, Graph } from '$scripts/entities';

	// Exports
	export let data: PageData
	$: course = Course.revive(data.course)
	$: graph = Graph.revive(data.graph)

	let graphInterface: GraphInterface

</script>


<!-- Markup -->


<DefaultLayout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: "Dashboard",
			href: "/app/dashboard"
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/app/course/${course.code}/overview`
		},
		{
			name: graph.name,
			href: `/app/course/${course.code}/graph/${graph.id}/overview`
		},
		{
			name: "Edit",
			href: `/app/course/${course.code}/graph/${graph.id}/edit`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<Button on:click={graphInterface.findGraph}> Find Graph </Button>
		<Button on:click={graphInterface.unlockAllFields}> Unlock Fields </Button>
		<Validation data={graph.validate()} />
		<div class="flex-spacer" />
		<LinkButton href={`/app/course/${course.code}/graph/${graph.id}/settings`}> Settings </LinkButton>
		<Button on:click={() => graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>
	</svelte:fragment>

	<div class="editor">
		<GraphInterface bind:this={graphInterface} graph={graph} />
	</div>

</DefaultLayout>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		height: 800px

</style>
