
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'
	import { SimpleModal } from '$scripts/modals'
	import type { SubjectController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Helpers
	class DeleteModal extends SimpleModal {
		async submit() {
			this.disabled = true
			delete_modal = delete_modal // Trigger reactivity
			await subject.delete()
			$graph = $graph // Trigger reactivity
			this.hide()
		}
	}

	// Exports
	export let subject: SubjectController

	// Modal
	let delete_modal = new DeleteModal()

</script>


<!-- Markup -->

<Modal bind:this={delete_modal.modal}>
	<h3 slot="header"> Delete Subject </h3>
	Are you sure you want to delete this subject? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={delete_modal.disabled}
			on:click={async () => await delete_modal.submit()}
		> Delete </Button>
	</svelte:fragment>
</Modal>

<div class="subject-row">
	<IconButton scale
		src={trash_icon}
		description="Delete Subject"
		on:click={async () => {
			if (subject.unchanged) {
				await subject.delete()
				$graph = $graph // Trigger reactivity
			} else {
				delete_modal.show()
			}
		}}
	/>

	<Textfield
		id="name"
		placeholder="Subject Name"
		bind:value={subject.name}
		on:input={() => { $graph = $graph /* Trigger reactivity */ }}
		on:change={async () => await subject.save() }
	/>

	<Dropdown
		id="domain"
		placeholder="Select a domain"
		options={subject.domain_options}
		bind:value={subject.domain}
		on:change={async () => {
			await subject.save()
			$graph = $graph // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={subject.color} />
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.subject-row
		display: grid
		grid-template: "delete name style preview" auto / $total-icon-size 1fr 1fr $total-icon-size
		grid-gap: $form-small-gap
		place-items: center

		width: 100%

		color: $dark-gray

		.preview
			width: $input-icon-size
			height: $input-icon-size
			margin: $input-icon-padding
</style>
