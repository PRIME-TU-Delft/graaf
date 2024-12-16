<script lang="ts">
	// External dependencies
	import { goto } from '$app/navigation';

	// Internal dependencies
	import { program, save_status } from './stores';
	import { Severity } from '$scripts/validation';

	// Components
	import SimpleModal from '$components/SimpleModal.svelte';
	import SaveStatus from '$components/SaveStatus.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import Textfield from '$components/Textfield.svelte';
	import Feedback from '$components/Feedback.svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';

	// Assets
	import trash_icon from '$assets/trash-icon.svg';

	// Main
	let archive_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<SimpleModal bind:this={archive_modal}>
	{#snippet header()}
		<h3>Archive Program</h3>
	{/snippet}
	Are you certain you want to archive this program? When you archive a program, it, and all associated
	courses and graphs, will no longer be visible to anyone except super-admins. Only they can restore
	them.

	{#snippet footer()}
		<LinkButton onclick={() => archive_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await $program.delete(); // TODO this should archive, not delete
				goto('/app/home');
			}}
		>
			Archive
		</Button>
	{/snippet}
</SimpleModal>

<div class="wrapper">
	<SaveStatus bind:this={$save_status} />

	<Card>
		{#snippet header()}
			<h3>General</h3>

			<div class="flex-spacer"></div>

			<Button dangerous onclick={() => archive_modal?.show()}>
				<img src={trash_icon} alt="" /> Archive Program
			</Button>
		{/snippet}

		<label for="name"> Program Name </label>

		<Textfield
			id="name"
			bind:value={$program.name}
			oninput={async () => {
				$save_status.setUnsaved();
				await $program.save($save_status);
			}}
		/>

		<Feedback data={$program.validateName()} />
	</Card>
</div>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.wrapper
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap

</style>
