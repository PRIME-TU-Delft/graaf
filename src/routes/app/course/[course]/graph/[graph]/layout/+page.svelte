
<script lang="ts">

	// Svelte imports
	import { goto } from '$app/navigation'

	// Internal imports
	import { course, graph } from '$stores'

	// Components
	import DefaultLayout from '$layouts/DefaultLayout.svelte'
	import GraphSVG from '$components/GraphSVG.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Infobox from '$components/Infobox.svelte'

	// Assets
	import saveIcon from '$assets/save-icon.svg'
	import LinkButton from '$components/LinkButton.svelte'

	// Functions
	function goto_settings() {
		$graph.save()
		goto(`/app/course/${$course.code}/graph/${$graph.id}/settings`)
	}

	function toggle_autolayout() {
		if (graphSVG.controller.autolayout_enabled) {
			graphSVG.controller.toggleAutolayout()
		} else {
			autolayout_modal.show()
		}
	}

	// Variables
	let graphSVG: GraphSVG
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
			name: `${$course.code} ${$course.name}`,
			href: `/app/course/${$course.code}/overview`
		},
		{
			name: $graph.name,
			href: `/app/course/${$course.code}/graph/${$graph.id}/overview`
		},
		{
			name: "Edit",
			href: `/app/course/${$course.code}/graph/${$graph.id}/edit`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<Button on:click={() => graphSVG.controller.findGraph()}> Find Graph </Button>
		<Button on:click={toggle_autolayout}> Toggle Autolayout </Button>

		<Modal bind:this={autolayout_modal}>
			<h3 slot="header"> Autolayout </h3>
			<p> You are about to activate autolayout. This will <b>irreversibly</b> alter the layout of your graph. </p>

			<Infobox>
				When you activate autolayout, 'unlocked' nodes with a dashed outline will repel other nodes, and be attracted by their relations. Drag or click nodes to 'lock' them in place.
			</Infobox>

			<div class="button-row">
				<Button on:click={() => { graphSVG.controller.toggleAutolayout(); autolayout_modal.hide() }}> Enable autolayout </Button> <!-- TODO redirect to course overview -->
			</div>
		</Modal>

		<div class="flex-spacer" />

		<LinkButton on:click={goto_settings}> Edit fields & relations </LinkButton>
		<Button on:click={() => $graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>
	</svelte:fragment>

	<div class="editor">
		<GraphSVG bind:this={graphSVG} />
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
