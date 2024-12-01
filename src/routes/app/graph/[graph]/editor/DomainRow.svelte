
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'
	import type { DomainController } from '$scripts/controllers'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Main
	export let domain: DomainController
	let delete_modal: SimpleModal

</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	<h3 slot="header"> Delete Domain </h3>
	Are you sure you want to delete this domain? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => delete_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				await domain.delete()
				$graph = $graph // Trigger reactivity
			}}
		> Delete </Button>
	</svelte:fragment>
</SimpleModal>

<div class="domain-row">
	<IconButton scale
		src={trash_icon}
		description="Delete Domain"
		on:click={async () => {
			if (domain.unchanged) {
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

	@import "./styles.sass"
		
</style>
