
<script lang="ts">

	// Svelte imports
	import type { Writable } from 'svelte/store'

	// Internal imports
	import { Graph } from '$scripts/entities'

	// Components
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Variables
	export let graph: Writable<Graph>
	let delete_modal: Modal

</script>


<!-- Markup -->


<div class="editor">

	<!-- Settings -->
	<div class="setting">
		<label for="name"> Name </label>
		<Textfield label="Name" bind:value={$graph.name} />
	</div>

	<!-- Button row -->
	<div class="button-row">

		<!-- Delete graph button -->
		<Button dangerous on:click={delete_modal.show}> <img src={trashIcon} alt=""> Delete Graph </Button>
		<Modal bind:this={delete_modal}>
			<h3 slot="header"> Delete Graph </h3>
			<p> Are you sure you want to delete {$graph.name}? This action <b>cannot</b> be undone. </p>

			<div class="button-row">
				<Button dangerous on:click={$graph.delete}> Delete </Button> <!-- TODO redirect to course overview -->
			</div>
		</Modal>
	</div>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		padding: $card-thick-padding
	
	.button-row
		display: flex
		justify-content: flex-end
		margin-top: $form-big-gap

</style>
