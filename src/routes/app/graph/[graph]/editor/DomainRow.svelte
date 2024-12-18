<script lang="ts">
	// Internal dependencies
	import { graph, save_status } from './stores';
	import type { DomainController } from '$scripts/controllers';

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
		// Main
		domain: DomainController;
	}

	let { domain = $bindable() }: Props = $props();
	let delete_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	{#snippet header()}
		<h3>Delete Domain</h3>
	{/snippet}
	Are you sure you want to delete this domain? This action cannot be undone.

	{#snippet footer()}
		<LinkButton onclick={() => delete_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await domain.delete();
				$graph = $graph; // Trigger reactivity
			}}
		>
			Delete
		</Button>
	{/snippet}
</SimpleModal>

<div class="domain-row">
	<IconButton
		scale
		src={trash_icon}
		description="Delete Domain"
		onclick={async () => {
			if (domain.unchanged) {
				await domain.delete();
				$graph = $graph; // Trigger reactivity
			} else {
				delete_modal?.show();
			}
		}}
	/>

	<Textfield
		id="name"
		placeholder="Domain Name"
		bind:value={domain.name}
		oninput={async () => {
			$save_status.setUnsaved();
			await domain.save($save_status);
			$graph = $graph; /* Trigger reactivity */
		}}
	/>

	<Dropdown
		placeholder="Select a style"
		options={domain.style_options}
		bind:value={domain.style}
		onchange={async () => {
			$save_status.setUnsaved();
			await domain.save($save_status);
			$graph = $graph; // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={domain.color}></span>
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>
