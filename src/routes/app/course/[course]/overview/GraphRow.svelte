
<script lang="ts">

	// Internal dependencies
	import { course_options } from './stores'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	import type {
		CourseController,
		GraphController
	} from '$scripts/controllers'

	// Components
	import Validation from '$components/Validation.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import openEyeIcon from '$assets/open-eye-icon.svg'
	import pencil_icon from '$assets/pencil-icon.svg'
	import trash_icon from '$assets/trash-icon.svg'
	import copy_icon from '$assets/copy-icon.svg'
	import link_icon from '$assets/link-icon.svg'

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
	export let graph: GraphController
	export let update: () => void

	// Modals
	let copy_modal = new CopyModal()

</script>


<!-- Markup -->


<div class="graph-row">
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
		src={openEyeIcon}
		description="View Graph"
		href="/app/graph/{graph.id}/view"
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
		on:click={async () => {
			await graph.delete()
			update()
		}}
	/>
</div>

{#if $course_options !== undefined}
	<Modal bind:this={copy_modal.modal}>
		<h3 slot="header"> Copy Graph </h3>
		Copy this graph to another course. This will create a new graph with the same content in the selected course.

		<form>
			<label for="course"> Target Course </label>
			<Dropdown
				id="course"
				placeholder="Target Course"
				bind:value={copy_modal.course}
				options={$course_options}
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
{/if}


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