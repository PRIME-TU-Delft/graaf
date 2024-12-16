<script lang="ts">
	// External dependencies
	import { goto } from '$app/navigation';

	// Internal dependencies
	import { course, save_status } from './stores';
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

	// Variables
	let archive_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<SimpleModal bind:this={archive_modal}>
	{#snippet header()}
		<h3>Archive Course</h3>
	{/snippet}
	Are you certain you want to archive this course? When you archive a course, it, and all associated
	graphs and links will no longer be visible to anyone except program administrators. Only they can restore
	them.

	{#snippet footer()}
		<LinkButton onclick={() => archive_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await $course.delete(); // TODO this should archive, not delete
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
				<img src={trash_icon} alt="" /> Archive Course
			</Button>
		{/snippet}

		<div class="grid">
			<label for="code"> Course Code </label>
			<label for="name"> Course Name </label>

			<Textfield
				id="code"
				bind:value={$course.code}
				oninput={async () => {
					$save_status.setUnsaved();
					await $course.save($save_status);
				}}
			/>

			<Textfield
				id="name"
				bind:value={$course.name}
				oninput={async () => {
					$save_status.setUnsaved();
					await $course.save($save_status);
				}}
			/>

			<Feedback data={$course.validateCode()} />
			<Feedback data={$course.validateName()} />
		</div>
	</Card>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.wrapper
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap

	.grid
		display: grid
		grid-template: "left right" auto / 1fr 1fr
		grid-gap: $form-small-gap

</style>
