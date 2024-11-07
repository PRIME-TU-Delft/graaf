
<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'

	// Internal dependencies
	import { course, graph } from './stores'

	// Components
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let update: () => void

	// Modals
	let delete_modal: Modal

</script>


<!-- Markup -->


<div class="editor">

	{#if $graph === undefined || $course === undefined}
		<p class="grayed"> Loading... </p>
	{:else}

		<!-- Settings -->
		<div class="setting">
			<label for="name"> Name </label>
			<Textfield 
				id="name" 
				bind:value={$graph.name} 
				on:change={async () => await $graph.save()}
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
				<p> Are you sure you want to delete {$graph.name}? This action <b>cannot</b> be undone. </p>

				<div class="button-row">
					<Button dangerous
						on:click={async () => {
							await $graph.delete()
							goto(`/app/course/${$course.id}/overview`) // Use got instead of href to avoid race conditions
						}}
					> Delete </Button>
				</div>
			</Modal>
		</div>
	{/if}
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
			margin-top: $form-medium-gap

</style>
