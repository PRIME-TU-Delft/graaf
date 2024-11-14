

<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import type { ProgramController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import ListRow from '$components/ListRow.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let program: ProgramController

	// Variables
	let remove_modal: Modal

</script>


<!-- Markup -->

<Modal bind:this={remove_modal}>
	<h3 slot="header"> Unnassign from program </h3>
	Are you certain you want to unnassign this course from "{program.name}"?

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => remove_modal.hide()}> Cancel </LinkButton>
		<Button on:click={async () => {
			$course.removeProgram(program)
			await $course.save()
			$course = $course // Trigger reactivity
			remove_modal.hide()
		}}> Archive </Button>
	</svelte:fragment>
</Modal>

<ListRow>
	<div class="grid">
		<IconButton 
		src={trashIcon}
		description="Unassign from program"
		on:click={() => remove_modal.show()}
		/>

		{program.name}

		<LinkButton href="/app/program/{program.id}/settings">
		Program Settings
		</LinkButton>
	</div>
</ListRow>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.grid
		display: grid
		grid-template: "trash name settings" auto / $total-icon-size 1fr max-content
		grid-gap: $form-small-gap
		place-items: center start

		:global(.link-button)
			justify-self: end

</style>