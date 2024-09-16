
<script lang="ts">

	// Internal imports
	import { course } from '$stores'

	// Components
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Modal from '$components/Modal.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Variables
	let deleteCourseModal: Modal

</script>


<!-- Markup -->


<div class="editor">

	<!-- Settings -->
	<div class="settings">
		<label for="code"> Code </label>
		<Textfield label="Code" bind:value={$course.code} />
		<label for="name"> Name </label>
		<Textfield label="Name" bind:value={$course.name} />
	</div>

	<!-- Button row -->
	<div class="button-row">

		<!-- Delete graph button -->
		<Button dangerous on:click={deleteCourseModal.show}> <img src={trashIcon} alt=""> Delete Course </Button>
		<Modal bind:this={deleteCourseModal}>
			<h3 slot="header"> Delete Course </h3>
			<p> Are you sure you want to delete {$course.code} {$course.name}? This action <b>cannot</b> be undone. </p>

			<div class="button-row">
				<LinkButton on:click={deleteCourseModal.hide}> Cancel </LinkButton>
				<Button dangerous on:click={$course.delete}> Delete </Button> <!-- TODO redirect to course overview -->
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

			label:not(:first-child)
				margin-top: $form-small-gap

		.button-row
			display: flex
			justify-content: flex-end
			margin-top: $form-big-gap

</style>
