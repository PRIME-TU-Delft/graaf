
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

	// Exports
	export let data: PageData

	// Variables
	let { course, graph } = data
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
			href: `/app/course/${course.code}/graph/${graph.uuid}/overview`
		},
		{
			name: "Edit",
			href: `/app/course/${course.code}/graph/${graph.uuid}/edit`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<Button on:click={graphInterface.findGraph}> Find Graph </Button>
		<div class="flex-spacer" />
		<LinkButton href={`/app/course/${course.code}/graph/${graph.uuid}/settings`}> Settings </LinkButton>
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
		height: 600px

</style>
