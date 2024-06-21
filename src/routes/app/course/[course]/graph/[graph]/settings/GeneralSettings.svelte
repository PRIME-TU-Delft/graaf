
<script lang="ts">

	// Internal imports
	import { Graph } from '$scripts/entities'

	// Components
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Modal from '$components/Modal.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let graph: Graph
	export let update: () => void

	// Variables
	let delete_modal: Modal

</script>


<!-- Markup -->


<div class="editor">

	<!-- Settings -->
	<div class="setting">
		<label for="name"> Name </label>
		<Textfield label="Name" bind:value={graph.name} on:input={update} />
	</div>

	<!-- Button row -->
	<div class="button-row">

		<!-- Delete graph button -->
		<Button dangerous on:click={delete_modal.show}> <img src={trashIcon} alt=""> Delete Graph </Button>
		<Modal bind:this={delete_modal}>
			<h3 slot="header"> Delete Graph </h3>
			Are you sure you want to delete {graph.name}? This action <b>cannot</b> be undone.

			<div slot="button-row">
				<LinkButton on:click={delete_modal.hide}> Cancel </LinkButton>
				<Button dangerous on:click={graph.delete}> Delete </Button> <!-- TODO redirect to course overview -->
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
