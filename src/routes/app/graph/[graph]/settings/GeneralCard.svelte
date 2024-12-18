<script lang="ts">
	// External dependencies
	import { goto } from '$app/navigation';

	// Internal dependencies
	import { graph, save_status } from './stores';
	// Components
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';
	import Feedback from '$components/Feedback.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import SaveStatus from '$components/SaveStatus.svelte';
	import SimpleModal from '$components/SimpleModal.svelte';
	import Textfield from '$components/Textfield.svelte';
	// Assets
	import trash_icon from '$assets/trash-icon.svg';

	// Variables
	let delete_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<SimpleModal bind:this={delete_modal}>
	{#snippet header()}
		<h3>Delete Graph</h3>
	{/snippet}
	Are you certain you want to archive this graph? When you archive a graph, it, and all associated courses
	and graphs, will no longer be visible to anyone except super-admins. Only they can restore them.

	{#snippet footer()}
		<LinkButton onclick={() => delete_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await $graph.delete();
				goto(`/app/course/${$graph.course_id}/overview`);
			}}
		>
			Delete
		</Button>
	{/snippet}
</SimpleModal>

<div class="wrapper">
	<SaveStatus bind:this={$save_status} />

	<Card>
		{#snippet header()}
			<h3>General</h3>
			<div class="flex-spacer"></div>
			<Button dangerous onclick={() => delete_modal?.show()}>
				<img src={trash_icon} alt="" /> Delete Graph
			</Button>
		{/snippet}

		<label for="name"> Graph Name </label>

		<Textfield
			id="name"
			bind:value={$graph.name}
			oninput={async () => {
				$save_status.setUnsaved();
				await $graph.save($save_status);
			}}
		/>

		<Feedback data={$graph.validateName()} />
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
