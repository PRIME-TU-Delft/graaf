
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import { FormModal } from '$scripts/modals'
	import { Validation, Severity } from '$scripts/validation'

	import type {
		CourseController,
		GraphController
	} from '$scripts/controllers'

	// Components
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Feedback from '$components/Feedback.svelte'
	import ListRow from '$components/ListRow.svelte'
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
			await graph.copy(this.course)
			$course = $course
			this.hide()
		}
	}
	// Exports
	export let graph: GraphController

	// Modals
	let delete_modal: Modal
	let copy_modal = new CopyModal()

</script>


<!-- Markup -->

<Modal bind:this={copy_modal.modal}>
	<h3 slot="header"> Copy Graph </h3>
	Copy this graph to another course. This will create a new graph with the same content in the selected course.

	<form>
		<label for="course"> Target Course </label>
		<Dropdown
			id="course"
			placeholder="Target Course"
			options={$course.copy_options}
			bind:value={copy_modal.course}
		/>

		<footer>
			<Button
				disabled={copy_modal.validate().severity === Severity.error}
				on:click={() => copy_modal.submit()}
			> Copy </Button>
			<Feedback data={copy_modal.validate()} />
		</footer>
	</form>
</Modal>

<Modal bind:this={delete_modal}>
	<h3 slot="header"> Delete Graph </h3>
	Are you sure you want to delete this graph? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button on:click={async () => {
			await graph.delete()
			$course = $course
			delete_modal.hide()
		}}> Delete </Button>
	</svelte:fragment>
</Modal>

<ListRow>
	<div class="grid">
		<img
			src={link_icon}
			alt="Link icon"
			class="link-icon"
			style:visibility={graph.link_ids.length > 0 ? 'visible' : 'hidden'}
		/>
	
		<span>
			{#if graph.name}
				{graph.name}
			{:else}
				<i> Unnamed graph </i>
			{/if}
		</span>
	
		<IconButton scale
			src={open_eye_icon}
			description="View Graph"
			href="/app/graph/{graph.id}/overview"
		/>
	
		<IconButton scale
			src={pencil_icon}
			description="Edit Graph"
			href="/app/graph/{graph.id}/settings"
		/>
	
		<IconButton scale
			src={copy_icon}
			description="Copy Graph"
			on:click={() => copy_modal.show()}
		/>
	
		<IconButton scale
			src={trash_icon}
			description="Delete Graph"
			on:click={() => delete_modal.show()}
		/>
	</div>
</ListRow>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.grid
		display: grid
		grid-template: "link name view edit copy delete" auto / $total-icon-size 1fr $input-icon-size $input-icon-size $input-icon-size $input-icon-size
		grid-gap: $form-small-gap
		place-items: center center

		span
			width: 100%

		.link-icon
			width: 0.9rem
			filter: $dark-purple-filter

</style>