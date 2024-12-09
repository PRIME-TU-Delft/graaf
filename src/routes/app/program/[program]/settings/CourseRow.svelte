

<script lang="ts">

	// Internal dependencies
	import { program } from './stores'
	import type { CourseController } from '$scripts/controllers'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Main
	export let course: CourseController
	let unassign_modal: SimpleModal

</script>

<!-- Markup -->

<SimpleModal bind:this={unassign_modal}>
	<h3 slot="header"> Unnassign Course </h3>
	Are you certain you want to unnassign {course.display_name} from this program?

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => unassign_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				$program.unassignCourse(course)
				await $program.save()
				$program = $program // Trigger reactivity
			}}
		> Unassign </Button>
	</svelte:fragment>
</SimpleModal>

<div class="row">
	<IconButton
		src={trash_icon}
		description="Unassign course"
		on:click={() => unassign_modal.show()}
	/>

	{course.display_name}

	<LinkButton href="/app/course/{course.id}/settings">
		Course Settings
	</LinkButton>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.row
		display: grid
		grid-template: "trash name settings" auto / $total-icon-size 1fr max-content
		grid-gap: $form-small-gap
		place-items: center start

		box-sizing: content-box
		height: $list-row-height
		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray
		border-bottom: 1px solid $gray

		&:first-child
			margin-top: -$input-thin-padding

		&:first-child
			border-bottom: none
			margin-bottom: -$input-thin-padding

		:global(.link-button)
			justify-self: end

</style>