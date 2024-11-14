

<script lang="ts">

	// Internal dependencies
	import { program } from './stores'
	import type { CourseController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import ListRow from '$components/ListRow.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let course: CourseController

	// Variables
	let remove_modal: Modal

</script>


<!-- Markup -->

<Modal bind:this={remove_modal}>
	<h3 slot="header"> Unnassign course </h3>
	Are you certain you want to unnassign "{course.name}" from this program?

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => remove_modal.hide()}> Cancel </LinkButton>
		<Button on:click={async () => {
			$program.removeCourse(course)
			await $program.save()
			$program = $program // Trigger reactivity
			remove_modal.hide()
		}}> Archive </Button>
	</svelte:fragment>
</Modal>

<ListRow>
	<div class="grid">
		<IconButton 
			src={trashIcon}
			description="Unassign course"
			on:click={() => remove_modal.show()}
		/>

		{course.name}

		<LinkButton href="/app/course/{course.id}/settings">
			Course Settings
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