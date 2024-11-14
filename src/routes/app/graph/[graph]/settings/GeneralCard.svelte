
<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'

	// Internal dependencies
	import { graph } from './stores.ts'
	import { Severity } from '$scripts/validation'

	// Components
	import Feedback from '$components/Feedback.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'

	// Variables
	let delete_modal: Modal

</script>


<!-- Markup -->

<Modal bind:this={delete_modal}>
	<h3 slot="header"> Delete Graph </h3>
	Are you certain you want to archive this graph?
	When you archive a graph, it, and all associated courses and graphs, will no longer be visible to anyone except super-admins. Only they can restore them.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button on:click={async () => {
			await $graph.delete()
			goto(`/app/course/${$graph.course_id}/overview`)
		}}> Delete </Button>
	</svelte:fragment>
</Modal>

<Card>
	<svelte:fragment slot="header">
		<h3> General </h3>
		<div class="flex-spacer" />
		<Button dangerous on:click={() => delete_modal.show()}>
			<img src={trash_icon} alt="" /> Delete Graph
		</Button>
	</svelte:fragment>

	<label for="name"> Graph Name </label>

	<Textfield 
		id="name"
		bind:value={$graph.name}
		on:change={async () => {
			if ($graph.validateName().severity !== Severity.error) {
				await $graph.save()
			}
		}}
	/>

	<Feedback data={$graph.validateName()} />
</Card>