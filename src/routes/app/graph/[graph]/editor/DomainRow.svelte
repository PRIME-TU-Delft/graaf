
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'
	import type { DomainController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Exports
	export let domain: DomainController

	// Modal
	let delete_modal: Modal

</script>


<!-- Markup -->

<Modal bind:this={delete_modal}>
	<h3 slot="header"> Delete Domain </h3>
	Are you sure you want to delete this domain? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button on:click={async () => {
			await domain.delete()
			$graph = $graph
			delete_modal.hide()
		}}> Delete </Button>
	</svelte:fragment>
</Modal>

<div class="row">
	<IconButton scale
		src={trash_icon}
		description="Delete Domain"
		on:click={async () => {
			if (domain.untouched) {
				await domain.delete()
				$graph = $graph // Trigger reactivity
			} else {
				delete_modal.show()
			}
		}}
	/>

	<Textfield
		id="name"
		placeholder="Domain Name"
		bind:value={domain.name}
		on:input={() => { $graph = $graph /* Trigger reactivity */ }}
		on:change={async () => await domain.save() }
	/>

	<Dropdown
		id="style"
		placeholder="Select a style"
		options={domain.style_options}
		bind:value={domain.style}
		on:change={async () => {
			await domain.save()
			$graph = $graph // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={domain.color} />
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.row
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
