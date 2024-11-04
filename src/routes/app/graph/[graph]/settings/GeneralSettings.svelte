
<script lang="ts">

	// Internal dependencies
	import { 
		CourseController,
		GraphController
	} from '$scripts/controllers';

	// Components
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Variables
	export let course: CourseController
	export let graph: GraphController
	export let update: () => void
	let delete_modal: Modal

</script>


<!-- Markup -->


<div class="editor">

	<!-- Settings -->
	<div class="setting">
		<label for="name"> Name </label>
		<Textfield 
			id="name" 
			bind:value={graph.name} 
			on:change={async () => await graph.save()}
			on:input={update}
			/>
	</div>

	<!-- Button row -->
	<div class="button-row">

		<!-- Delete graph button -->
		<Button dangerous on:click={() => delete_modal.show()}> 
			<img src={trashIcon} alt="Delete graph"> Delete Graph 
		</Button>

		<Modal bind:this={delete_modal}>
			<h3 slot="header"> Delete Graph </h3>
			<p> Are you sure you want to delete {graph.name}? This action <b>cannot</b> be undone. </p>

			<div class="button-row">
				<Button dangerous
					href="/app/course/{course.id}/overview"
					on:click={async () => await graph.delete()}
					> Delete
				</Button>
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
