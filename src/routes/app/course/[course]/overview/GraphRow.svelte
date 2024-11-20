
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import { FormModal, SimpleModal } from '$scripts/modals'
	import { Validation, Severity } from '$scripts/validation'

	import type {
		CourseController,
		GraphController
	} from '$scripts/controllers'

	// Components
	import GraphPreview from './GraphPreview.svelte'

	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import open_eye_icon from '$assets/open-eye-icon.svg'
	import pencil_icon from '$assets/pencil-icon.svg'
	import trash_icon from '$assets/trash-icon.svg'
	import copy_icon from '$assets/copy-icon.svg'
	import link_icon from '$assets/link-icon.svg'

	// Helpers
	class CopyModal extends FormModal {
		course: CourseController | null = null

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const result = new Validation()

			if (this.hasChanged('course') && this.course === null) {
				result.add({
					severity: Severity.error,
					short: 'Course is required'
				})
			}

			return result
		}

		async submit() {
			this.touchAll() // Validate all fields
			if (this.validate().severity === Severity.error) {
				copy_modal = copy_modal // Trigger reactivity
				return
			}

			// Copy graph
			this.disabled = true
			copy_modal = copy_modal // Trigger reactivity
			const copied_graph = await graph.copy(this.course!)
			await Promise.all([
				copied_graph.save(),
				copied_graph.domains.map(domain => domain.save()),
				copied_graph.subjects.map(subject => subject.save()),
				copied_graph.lectures.map(lecture => lecture.save())
			])
			
			$course = $course
			this.hide()
		}
	}

	class DeleteModal extends SimpleModal {
		async submit() {
			this.disabled = true
			delete_modal = delete_modal // Trigger reactivity
			await graph.delete()
			$course = $course
			this.hide()
		}
	}
	
	// Exports
	export let graph: GraphController

	// Variables
	let delete_modal = new DeleteModal()
	let copy_modal = new CopyModal()
	let preview_modal: GraphPreview

</script>


<!-- Markup -->

<GraphPreview {graph} bind:this={preview_modal} />

<Modal bind:this={copy_modal.modal}>
	<h3 slot="header"> Copy Graph </h3>
	Copy this graph to another course. This will create a new graph with the same content in the selected course.

	<form>
		<label for="course"> Target Course </label>
		<Dropdown
			id="course"
			placeholder="Select a course"
			options={graph.copy_options}
			bind:value={copy_modal.course}
		/>

		<footer>
			<Button
				disabled={copy_modal.disabled}
				on:click={() => copy_modal.submit()}
			> Copy </Button>
			<Feedback data={copy_modal.validate()} />
		</footer>
	</form>
</Modal>

<Modal bind:this={delete_modal.modal}>
	<h3 slot="header"> Delete Graph </h3>
	Are you sure you want to delete this graph? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={delete_modal.disabled}
			on:click={async () => await delete_modal.submit()}
		> Delete </Button>
	</svelte:fragment>
</Modal>

<span class="graph-row">
	<IconButton scale
		src={trash_icon}
		description="Delete Graph"
		on:click={() => delete_modal.show()}
	/>
	<IconButton scale
		src={copy_icon}
		description="Copy Graph"
		on:click={() => copy_modal.show()}
	/>
	<IconButton scale
		src={pencil_icon}
		description="Edit Graph"
		href="/app/graph/{graph.id}/editor"
	/>
	<IconButton scale
		src={open_eye_icon}
		description="Preview Graph"
		on:click={() => preview_modal.show()}
	/>

	<span>
		{#if graph.name}
			{graph.name}
		{:else}
			<i> Unnamed graph </i>
		{/if}
	</span>

	<img
		src={link_icon}
		alt="Link icon"
		style:visibility={graph.link_ids.length > 0 ? 'visible' : 'hidden'}
	/>
</span>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.graph-row
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

		img					
			width: $input-icon-size
			filter: $dark-purple-filter

</style>