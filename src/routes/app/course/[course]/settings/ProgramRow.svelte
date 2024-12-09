

<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import type { ProgramController } from '$scripts/controllers'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Main
	export let program: ProgramController
	let unassign_modal: SimpleModal

</script>


<!-- Markup -->

<SimpleModal bind:this={unassign_modal}>
	<h3 slot="header"> Unnassign Course </h3>
	Are you certain you want to unnassign this course from {program.display_name}?

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => unassign_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				$course.unassignFromProgram(program)
				await $course.save()
				$course = $course // Trigger reactivity
			}}
		> Unassign </Button>
	</svelte:fragment>
</SimpleModal>

<span class="program-row">
	<IconButton 
		src={trashIcon}
		description="Unassign from program"
		on:click={() => unassign_modal.show()}
	/>

	{program.display_name}

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