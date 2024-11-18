

<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import { SimpleModal } from '$scripts/modals'
	import type { ProgramController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Helpers
	class UnassignModal extends SimpleModal {
		async submit() {
			this.disabled = true
			unassign_modal = unassign_modal // Trigger reactivity
			$course.unassignFromProgram(program)
			await $course.save()
			$course = $course // Trigger reactivity
			this.hide()
		}
	}

	// Exports
	export let program: ProgramController

	// Variables
	let unassign_modal = new UnassignModal()

</script>


<!-- Markup -->

<Modal bind:this={unassign_modal.modal}>
	<h3 slot="header"> Unnassign from program </h3>
	Are you certain you want to unnassign this course from "{program.name}"?

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => unassign_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={unassign_modal.disabled}
			on:click={async () => await unassign_modal.submit()}
		> Archive </Button>
	</svelte:fragment>
</Modal>

<span class="program-row">
	<IconButton 
		src={trashIcon}
		description="Unassign from program"
		on:click={() => unassign_modal.show()}
	/>

	{program.name}

	<LinkButton href="/app/program/{program.id}/settings">
		Program Settings
	</LinkButton>
</span>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.program-row
		display: grid
		grid-template: "trash name settings" auto / $total-icon-size 1fr max-content
		grid-gap: $form-small-gap
		place-items: center start

		box-sizing: content-box
		height: $list-row-height
		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray
		border-bottom: 1px solid $gray

		&:first-of-type
			margin-top: -$input-thin-padding

		&:last-of-type
			border-bottom: none
			margin-bottom: -$input-thin-padding

		:global(.link-button)
			justify-self: end

</style>