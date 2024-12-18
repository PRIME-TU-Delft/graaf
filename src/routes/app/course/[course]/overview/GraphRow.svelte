<script lang="ts">
	// Internal dependencies
	import { course } from './stores';

	import { Validation, Severity } from '$scripts/validation';
	import { AbstractFormModal } from '$scripts/modals.svelte';
	import { tooltip } from '$scripts/actions/tooltip';

	import type { CourseController, GraphController } from '$scripts/controllers';

	// Components
	import GraphPreview from './GraphPreview.svelte';

	import SimpleModal from '$components/SimpleModal.svelte';
	import IconButton from '$components/IconButton.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import FormModal from '$components/FormModal.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Button from '$components/Button.svelte';

	// Assets
	import open_eye_icon from '$assets/open-eye-icon.svg';
	import pencil_icon from '$assets/pencil-icon.svg';
	import trash_icon from '$assets/trash-icon.svg';
	import copy_icon from '$assets/copy-icon.svg';
	import link_icon from '$assets/link-icon.svg';

	// Modals
	class CopyModal extends AbstractFormModal {
		course: CourseController | null = null;

		constructor() {
			super();
			this.initialize();
		}

		validate(): Validation {
			const result = new Validation();

			if (this.hasChanged('course') && this.course === null) {
				result.add({
					severity: Severity.error,
					short: 'Course is required'
				});
			}

			return result;
		}

		async submit() {
			const copied_graph = await graph.copy(this.course as CourseController);
			await Promise.all([
				copied_graph.save(),
				copied_graph.domains.map((domain) => domain.save()),
				copied_graph.subjects.map((subject) => subject.save()),
				copied_graph.lectures.map((lecture) => lecture.save())
			]);

			$course = $course; // Trigger reactivity
		}
	}

	interface Props {
		// Main
		graph: GraphController;
	}

	let { graph }: Props = $props();

	const copy_modal = $state(new CopyModal());

	let preview_modal = $state<GraphPreview>();
	let delete_modal = $state<SimpleModal>();
</script>

<!-- Markup -->

<GraphPreview {graph} bind:this={preview_modal} />

<FormModal controller={copy_modal}>
	{#snippet header()}
		<h3>Copy Graph</h3>
	{/snippet}
	Copy this graph to another course. This will create a new graph with the same content in the selected
	course.

	{#snippet form()}
		<label for="course"> Target Course </label>
		<Dropdown
			placeholder="Select a course"
			options={graph.copy_options}
			bind:value={copy_modal.course}
		/>
	{/snippet}

	{#snippet submit()}
		Copy
	{/snippet}
</FormModal>

<SimpleModal bind:this={delete_modal}>
	{#snippet header()}
		<h3>Delete Graph</h3>
	{/snippet}
	Are you sure you want to delete this graph? This action cannot be undone.

	{#snippet footer()}
		<LinkButton onclick={() => delete_modal?.hide()}>Cancel</LinkButton>
		<Button
			onclick={async () => {
				await graph.delete();
				$course = $course; // Trigger reactivity
			}}
		>
			Delete
		</Button>
	{/snippet}
</SimpleModal>

<span class="row">
	<IconButton
		scale
		src={trash_icon}
		description="Delete Graph"
		onclick={() => delete_modal?.show()}
	/>
	<IconButton scale src={copy_icon} description="Copy Graph" onclick={() => copy_modal.show()} />
	<IconButton
		scale
		src={pencil_icon}
		description="Edit Graph"
		href="/app/graph/{graph.id}/editor"
	/>
	<IconButton
		scale
		src={open_eye_icon}
		description="Preview Graph"
		onclick={() => preview_modal?.show()}
	/>

	<span>
		{#if graph.trimmed_name}
			{graph.trimmed_name}
		{:else}
			<i> {graph.display_name} </i>
		{/if}
	</span>

	{#if graph.link_ids.length > 0}
		<div
			class="link-icon"
			use:tooltip={`Has ${graph.link_ids.length} associated link${graph.link_ids.length > 1 ? 's' : ''}`}
		>
			<img src={link_icon} alt="Link icon" />
		</div>
	{/if}
</span>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.row
		display: grid
		grid-template: "delete copy edit view name link" auto / $input-icon-size $input-icon-size calc($input-icon-size - 2.5px) $input-icon-size 1fr max-content
		grid-gap: $form-small-gap
		place-items: center start

		box-sizing: content-box
		height: $list-row-height
		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray
		border-bottom: 1px solid $gray

		&:first-of-type
			margin-top: -$input-thin-padding

		&:last-of-type
			border-bottom: none
			margin-bottom: -$input-thin-padding

		span
			padding: $input-thin-padding $input-thick-padding

		.link-icon
			height: $input-icon-size

			img
				width: $input-icon-size
				filter: $dark-purple-filter

</style>
