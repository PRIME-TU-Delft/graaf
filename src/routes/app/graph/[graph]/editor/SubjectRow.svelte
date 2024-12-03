
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'
	import type { SubjectController } from '$scripts/controllers'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Exports
	export let subject: SubjectController

	// Modal
	let delete_modal: SimpleModal

</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	<h3 slot="header"> Delete Subject </h3>
	Are you sure you want to delete this subject? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => delete_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				await subject.delete()
				$graph = $graph // Trigger reactivity
			}}
		> Delete </Button>
	</svelte:fragment>
</SimpleModal>

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
		on:input={async () => {
			await subject.save() 
			$graph = $graph // Trigger reactivity
		}}
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

	@import "./styles.sass"

</style>
