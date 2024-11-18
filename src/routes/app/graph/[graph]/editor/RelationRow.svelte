
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'
	import { SimpleModal } from '$scripts/modals'

	import type { 
		RelationController, 
		DomainController, 
		SubjectController 
	} from '$scripts/controllers'

	// Components
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
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
			await relation.delete()
			$graph = $graph // Trigger reactivity
			this.hide()
		}
	}

	// Exports
	export let relation: RelationController<DomainController | SubjectController>

	// Modal
	let delete_modal = new DeleteModal()

</script>


<!-- Markup -->


<Modal bind:this={delete_modal.modal}>
	<h3 slot="header"> Delete Relation </h3>
	Are you sure you want to delete this relation? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={delete_modal.disabled}
			on:click={async () => await delete_modal.submit()}
		> Delete </Button>
	</svelte:fragment>
</Modal>

<div class="relation-row">
	<IconButton scale
		src={trash_icon}
		description="Delete Relation"
		on:click={async () => {
			if (relation.unchanged) {
				await relation.delete()
				$graph = $graph // Trigger reactivity
			} else {
				delete_modal.show()
			}
		}}
	/>

	<Dropdown
		id="parent"
		placeholder="Select a parent"
		options={relation.parent_options}
		bind:value={relation.parent}
		on:change={async () => {
			await relation.save()
			$graph = $graph // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={relation.parent_color} />

	<Dropdown
		id="child"
		placeholder="Select a child"
		options={relation.child_options}
		bind:value={relation.child}
		on:change={async () => {
			await relation.save()
			$graph = $graph // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={relation.child_color} />
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.relation-row
		display: grid
		grid-template: "delete parent parent-preview child child-preview" auto / $total-icon-size 1fr $total-icon-size 1fr $total-icon-size
		grid-gap: $form-small-gap
		place-items: center center

		width: 100%

		.preview
			width: $input-icon-size
			height: $input-icon-size
			margin: $input-icon-padding

</style>
