
<script lang="ts">

	// Internal dependencies
	import { graph, save_status } from './stores'

	import type { 
		RelationController, 
		DomainController, 
		SubjectController 
	} from '$scripts/controllers'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Exports
	export let relation: RelationController<DomainController | SubjectController>

	// Modal
	let delete_modal: SimpleModal

</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	<h3 slot="header"> Delete Relation </h3>
	Are you sure you want to delete this relation? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => delete_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				await relation.delete()
				$graph = $graph // Trigger reactivity
			}}
		> Delete </Button>
	</svelte:fragment>
</SimpleModal>

<div class="relation-row">
	<IconButton scale
		src={trash_icon}
		description="Delete Relation"
		on:click={async () => {
			if (relation.is_empty) {
				await relation.delete()
				$graph = $graph // Trigger reactivity
			} else {
				delete_modal.show()
			}
		}}
	/>

	<Dropdown
		placeholder="Select a parent"
		options={relation.parent_options}
		bind:value={relation.parent}
		on:change={async () => {
			$save_status.setUnsaved()
			await relation.save($save_status)
			$graph = $graph // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={relation.parent_color} />

	<Dropdown
		placeholder="Select a child"
		options={relation.child_options}
		bind:value={relation.child}
		on:change={async () => {
			$save_status.setUnsaved()
			await relation.save($save_status)
			$graph = $graph // Trigger reactivity
		}}
	/>

	<span class="preview" style:background={relation.child_color} />
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"	

</style>
