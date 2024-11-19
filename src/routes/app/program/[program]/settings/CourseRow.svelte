

<script lang="ts">

	// Internal dependencies
	import { program } from './stores'
	import { SimpleModal } from '$scripts/modals'
	import type { CourseController } from '$scripts/controllers'

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
			$program.unassignCourse(course)
			await $program.save()
			$program = $program // Trigger reactivity
			this.hide()
		}
	}

	// Exports
	export let course: CourseController

	// Variables
	let unassign_modal = new UnassignModal()

</script>


<!-- Markup -->

<Modal bind:this={unassign_modal.modal}>
	<h3 slot="header"> Unnassign Course </h3>
	Are you certain you want to unnassign {course.code} {course.name} from this program?

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => unassign_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={unassign_modal.disabled}
			on:click={async () => await unassign_modal.submit()}
		> Unassign </Button>
	</svelte:fragment>
</Modal>

<span class="course-row">
	<IconButton 
		src={trashIcon}
		description="Unassign course"
		on:click={() => unassign_modal.show()}
	/>

	{course.code} {course.name}

	<LinkButton href="/app/course/{course.id}/settings">
		Course Settings
	</LinkButton>
</span>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.course-row
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