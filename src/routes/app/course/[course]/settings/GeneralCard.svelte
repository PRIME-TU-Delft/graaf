
<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'

	// Internal dependencies
	import { course, save_status } from './stores'
	import { handleError } from '$scripts/utility'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Variables
	let archive_modal: SimpleModal

</script>

<!-- Markup -->

<SimpleModal bind:this={archive_modal}>
	<h3 slot="header"> Archive Course </h3>
	Are you certain you want to archive this course? When you archive a course, it, and all associated graphs and links will no longer be visible to anyone except program administrators. Only they can restore them.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => archive_modal.hide()}
		> Cancel </LinkButton>
		
		<Button
			on:click={async () => {
				try {
					await $course.delete() // TODO this should archive, not delete
					goto('/app/home')
				} catch (error) {
					handleError(error, $save_status)
				}
			}}
		> Archive </Button>
	</svelte:fragment>
</SimpleModal>

<Card>
	<svelte:fragment slot="header">
		<h3> General </h3>

		<div class="flex-spacer" />

		<Button dangerous on:click={() => archive_modal.show()}>
			<img src={trash_icon} alt="" /> Archive Course
		</Button>
	</svelte:fragment>

	<div class="grid">
		<label for="code"> Course Code </label>
		<label for="name"> Course Name </label>

		<Textfield 
			id="code"
			bind:value={$course.code}
			on:input={async () => {
				$save_status.setUnsaved()

				try {
					await $course.save($save_status)
				} catch (error) {
					handleError(error, $save_status)
				}
			}}
		/>

		<Textfield 
			id="name"
			bind:value={$course.name}
			on:input={async () => {
				$save_status.setUnsaved()

				try {
					await $course.save($save_status)
				} catch (error) {
					handleError(error, $save_status)
				}
			}}
		/>

		<Feedback data={$course.validateCode()} />
		<Feedback data={$course.validateName()} />
	</div>
</Card>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.grid
		display: grid
		grid-template: "left right" auto / 1fr 1fr
		grid-gap: $form-small-gap

</style>