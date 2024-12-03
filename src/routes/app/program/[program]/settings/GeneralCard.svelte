
<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'

	// Internal dependencies
	import { program } from './stores'
	import { Severity } from '$scripts/validation'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Main
	let archive_modal: SimpleModal

</script>

<!-- Markup -->

<SimpleModal bind:this={archive_modal}>
	<h3 slot="header"> Archive Program </h3>
	Are you certain you want to archive this program? When you archive a program, it, and all associated courses and graphs, will no longer be visible to anyone except super-admins. Only they can restore them.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => archive_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				await $program.delete() // TODO this should archive, not delete
				goto('/app/home')
			}}
		> Archive </Button>
	</svelte:fragment>
</SimpleModal>

<Card>
	<svelte:fragment slot="header">
		<h3> General </h3>

		<div class="flex-spacer" />

		<Button dangerous on:click={() => archive_modal.show()}>
			<img src={trash_icon} alt="" /> Archive Program
		</Button>
	</svelte:fragment>

	<label for="name"> Program Name </label>

	<Textfield
		id="name"
		bind:value={$program.name}
		on:input={async () => {
			if ($program.validateName().severity !== Severity.error) {
				await $program.save()
			}
		}}
	/>

	<Feedback data={$program.validateName()} />
</Card>