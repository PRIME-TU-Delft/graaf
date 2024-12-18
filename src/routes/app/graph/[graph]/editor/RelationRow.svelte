<script lang="ts">
	// Internal dependencies
	import { graph, save_status } from './stores';

	import type {
		RelationController,
		DomainController,
		SubjectController
	} from '$scripts/controllers';

	// Components
	import SimpleModal from '$components/SimpleModal.svelte';
	import IconButton from '$components/IconButton.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Button from '$components/Button.svelte';

	// Assets
	import trash_icon from '$assets/trash-icon.svg';

	interface Props {
		// Exports
		relation: RelationController<DomainController | SubjectController>;
	}

	let { relation = $bindable() }: Props = $props();

	// Modal
	let delete_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	{#snippet header()}
		<h3>Delete Relation</h3>
	{/snippet}
	Are you sure you want to delete this relation? This action cannot be undone.

	{#snippet footer()}
		<LinkButton onclick={() => delete_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await relation.delete();
				$graph = $graph; // Trigger reactivity
			}}
		>
			Delete
		</Button>
	{/snippet}
</SimpleModal>

<div class="relation-row">
	<IconButton
		scale
		src={trash_icon}
		description="Delete Relation"
		onclick={async () => {
			if (relation.unchanged) {
				await relation.delete();
				$graph = $graph; // Trigger reactivity
			} else {
				delete_modal?.show();
			}
		}}
	/>

	<Dropdown
		placeholder="Select a parent"
		options={relation.parent_options}
		bind:value={relation.parent}
		onchange={async () => {
			$save_status.setUnsaved();
			await relation.save($save_status);
			$graph = $graph; // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={relation.parent_color}></span>

	<Dropdown
		placeholder="Select a child"
		options={relation.child_options}
		bind:value={relation.child}
		onchange={async () => {
			$save_status.setUnsaved();
			await relation.save($save_status);
			$graph = $graph; // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={relation.child_color}></span>
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"	

</style>
