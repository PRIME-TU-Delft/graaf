<script lang="ts">
	// Internal dependencies
	import { graph, save_status } from './stores';
	import type { SubjectController } from '$scripts/controllers';

	// Components
	import SimpleModal from '$components/SimpleModal.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import IconButton from '$components/IconButton.svelte';
	import Textfield from '$components/Textfield.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Button from '$components/Button.svelte';

	// Assets
	import trash_icon from '$assets/trash-icon.svg';

	interface Props {
		// Exports
		subject: SubjectController;
	}

	let { subject = $bindable() }: Props = $props();

	// Modal
	let delete_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	{#snippet header()}
		<h3>Delete Subject</h3>
	{/snippet}
	Are you sure you want to delete this subject? This action cannot be undone.

	{#snippet footer()}
		<LinkButton onclick={() => delete_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await subject.delete();
				$graph = $graph; // Trigger reactivity
			}}
		>
			Delete
		</Button>
	{/snippet}
</SimpleModal>

<div class="subject-row">
	<IconButton
		scale
		src={trash_icon}
		description="Delete Subject"
		onclick={async () => {
			if (subject.unchanged) {
				await subject.delete();
				$graph = $graph; // Trigger reactivity
			} else {
				delete_modal?.show();
			}
		}}
	/>

	<Textfield
		id="name"
		placeholder="Subject Name"
		bind:value={subject.name}
		oninput={async () => {
			$save_status.setUnsaved();
			await subject.save($save_status);
			$graph = $graph; // Trigger reactivity
		}}
	/>

	<Dropdown
		placeholder="Select a domain"
		options={subject.domain_options}
		bind:value={subject.domain}
		onchange={async () => {
			$save_status.setUnsaved();
			await subject.save($save_status);
			$graph = $graph; // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={subject.color}></span>
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>
