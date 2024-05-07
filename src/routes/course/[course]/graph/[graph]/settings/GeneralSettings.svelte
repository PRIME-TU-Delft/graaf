
<script lang="ts">

	// Scripts
	import { Graph } from "$scripts/entities"

	// Components
	import Modal from "$components/Modal.svelte"
	import Button from "$components/Button.svelte"
	import LinkButton from "$components/LinkButton.svelte"
	import Textfield from "$components/Textfield.svelte"

	// Assets
	import trashIcon from "$assets/trash-icon.svg"

	// Exports
	export let graph: Graph

	// Variables
	let deleteGraphModal: Modal

</script>



<!-- Markup -->



<div class="editor">

	<!-- Settings -->
	<div class="settings">
		<label for="name"> Name </label>
		<Textfield label="Name" bind:value={graph.name} />
	</div>

	<!-- Button row -->
	<div class="button-row">

		<!-- Delete graph button -->
		<Button on:click={deleteGraphModal.show}> <img src={trashIcon} alt=""> Delete Graph </Button>
		<Modal bind:this={deleteGraphModal}>
			<h3 slot="header"> Delete Graph </h3>
			Are you sure you want to delete {graph.name}?

			<div class="button-row">
				<LinkButton on:click={deleteGraphModal.hide}> Cancel </LinkButton>
				<Button on:click={graph.delete}> Delete Graph </Button> <!-- TODO redirect to course overview -->
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

		.settings
			display: flex
			flex-flow: column

		.button-row
			display: flex
			flex-flow: row nowrap
			justify-content: end
			gap: $form-small-gap

			margin-top: $form-big-gap

</style>