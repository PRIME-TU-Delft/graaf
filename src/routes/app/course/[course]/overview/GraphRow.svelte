
<script lang="ts">

	// Internal dependencies
	import { BaseModal } from '$scripts/modals'
	import type { DropdownOption } from '$scripts/types'
	import { ValidationData, Severity } from '$scripts/validation'

	import {
		CourseController,
		GraphController
	} from '$scripts/controllers'

	// Components
	import Button from '$components/buttons/Button.svelte'
	import IconButton from '$components/buttons/IconButton.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'
	import copyIcon from '$assets/copy-icon.svg'
	import openEyeIcon from '$assets/open-eye-icon.svg'
	import closedEyeIcon from '$assets/closed-eye-icon.svg'
	import pencilIcon from '$assets/pencil-icon.svg'
	import linkIcon from '$assets/link-icon.svg'
	import Modal from '$components/layouts/Modal.svelte';
	import Dropdown from '$components/forms/Dropdown.svelte';

	// Helpers
	class CopyModal extends BaseModal {
		course: CourseController | null = null

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.course === null) {
				result.add({
					severity: Severity.error,
					short: 'Course is required'
				})
			}

			return result
		}

		async submit() {
			await graph.copy(this.course!)
			this.hide()
			update()
		}
	}

	// Exports
	export let course: CourseController
	export let graph: GraphController
	export let course_options: DropdownOption<CourseController>[]
	export let update: () => void

	// Modals
	let copy_modal = new CopyModal()

</script>


<!-- Markup -->


<div class="graph-row">
	<img 
		src={linkIcon} 
		alt="Link icon" 
		class="link-icon"
		style:visibility={graph.link_ids.length > 0 ? 'visible' : 'hidden'}
	/>

	<span> {graph.name} </span>

	<!-- TODO graph preview -->
	<IconButton scale
		disabled={false}
		src={true ? openEyeIcon : closedEyeIcon}
		description="View Graph"
	/>

	<IconButton scale
		src={pencilIcon}
		description="Edit Graph"
		href="/app/course/{course.id}/graph/{graph.id}/settings"
	/>

	<IconButton scale 
		src={copyIcon} 
		description="Copy Graph" 
		on:click={() => copy_modal.show()}
	/>

	<IconButton scale
		src={trashIcon}
		description="Delete Graph"
		on:click={async () => {
			await graph.delete()
			update()
		}}
	/>
</div>

<Modal bind:this={copy_modal.modal}>
	<h3 slot="header"> Copy Graph </h3>
	Copy this graph to another course. This will create a new graph with the same content in the selected course.

	<form>
		<label for="course"> Target Course </label>
		<Dropdown
			id="course"
			placeholder="Target Course"
			bind:value={copy_modal.course}
			options={course_options}
		/>

		<footer>
			<Button
				disabled={!copy_modal.validate().okay()}
				on:click={() => copy_modal.submit()}
			> Copy </Button>
			<Validation data={copy_modal.validate()} />
		</footer>
	</form>
</Modal>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.graph-row
		display: grid
		grid-template: "link name view edit copy delete" auto / $total-icon-size 1fr $input-icon-size $input-icon-size $input-icon-size $input-icon-size
		grid-gap: $form-small-gap
		place-items: center start

		height: $total-icon-size
		padding: $input-thin-padding $input-thick-padding
		box-sizing: content-box

		color: $dark-gray

		&:not(:last-child)
			border-bottom: 1px solid $gray

		.link-icon
			width: $input-icon-size
			filter: $dark-purple-filter

</style>