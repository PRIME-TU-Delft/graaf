
<script lang="ts">

	// Svelte imports
	import type { PageData } from './$types'

	// Components
	import DefaultLayout from '$layouts/DefaultLayout.svelte'
	import GraphInterface from '$components/GraphInterface.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Infobox from '$components/Infobox.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'
	import LinkButton from '$components/LinkButton.svelte'
	import Validation from '$components/Validation.svelte';
	import { Course, Graph } from '$scripts/entities';

	// Exports
	export let data: PageData
	$: course = Course.revive(data.course)
	$: graph = Graph.revive(data.graph)

	let graph_interface: GraphInterface
	let autolayout_modal: Modal

</script>


<!-- Markup -->


<DefaultLayout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position. Use the autolayout button to allow the system to automatically arrange the nodes. Remember to save your changes before leaving the page."
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
		<Button on:click={graph_interface.findGraph}> Find Graph </Button>
		<Button on:click={autolayout_modal.show}> Autolayout </Button>
		<Validation data={graph.validate()} />
		<div class="flex-spacer" />
		<LinkButton href={`/app/course/${course.code}/graph/${graph.id}/settings`}> Settings </LinkButton>
		<Button on:click={() => graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>

		<Modal bind:this={autolayout_modal}>
			<h3 slot="header"> Autolayout </h3>
			<p> You are about to activate autolayout. This will <b>irreversibly</b> alter the layout of your graph. </p>

			<Infobox>
				When you activate autolayout, 'unlocked' nodes with a dashed outline will repel other nodes, and be attracted by their relations. Drag or click nodes to 'lock' them in place.
			</Infobox>

			<div class="button-row">
				<Button dangerous on:click={() => { graph_interface.autolayout(); autolayout_modal.hide() }}> Activate autolayout </Button> <!-- TODO redirect to course overview -->
			</div>
		</Modal>
	</svelte:fragment>

	<div class="editor">
		<GraphInterface bind:this={graph_interface} graph={graph} />
	</div>

</DefaultLayout>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.button-row
		display: flex
		justify-content: flex-end
		margin-top: $card-thin-padding

	.editor
		height: 800px

</style>
