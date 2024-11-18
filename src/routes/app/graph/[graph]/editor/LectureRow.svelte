
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'
	import { FormModal, SimpleModal } from '$scripts/modals'
	import { Validation, Severity } from '$scripts/validation'

	import type { 
		LectureController, 
		SubjectController 
	} from '$scripts/controllers'
	
	// Components
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'
	import plus_icon from '$assets/plus-icon.svg'

	// Exports
	export let lecture: LectureController

	// Helpers
	class AssignSubjectModal extends FormModal {
		subject: SubjectController | null = null

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const result = new Validation()

			if (this.hasChanged('subject') && this.subject === null) {
				result.add({
					severity: Severity.error,
					short: 'Subject is required'
				})
			}

			return result
		}

		async submit() {
			this.touchAll() // Validate all fields
			if (this.validate().severity === Severity.error) {
				assign_subject_modal = assign_subject_modal // Trigger reactivity
				return
			}

			// Assign subject
			this.disabled = true
			assign_subject_modal = assign_subject_modal // Trigger reactivity
			lecture.assignSubject(this.subject!)
			await lecture.save()
			$graph = $graph
			this.hide()
		}
	}

	class DeleteModal extends SimpleModal {
		async submit() {
			this.disabled = true
			delete_modal = delete_modal // Trigger reactivity
			await lecture.delete()
			$graph = $graph
			this.hide()
		}
	}

	// Modal
	let delete_modal = new DeleteModal()
	let assign_subject_modal = new AssignSubjectModal()

</script>

<Modal bind:this={assign_subject_modal.modal}>
	<h3 slot="header"> Assign Subject </h3>
	Assign a subject to this lecture.

	<form>
		<label for="subject"> Target Subject </label>
		<Dropdown
			id="subject"
			placeholder="Select a subject"
			options={lecture.subject_options}
			bind:value={assign_subject_modal.subject}
		/>

		<footer>
			<Button
				disabled={assign_subject_modal.disabled}
				on:click={async () => await assign_subject_modal.submit()}
			> Copy </Button>
			<Feedback data={assign_subject_modal.validate()} />
		</footer>
	</form>
</Modal>

<Modal bind:this={delete_modal.modal}>
	<h3 slot="header"> Delete Lecture </h3>
	Are you sure you want to delete this lecture? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => delete_modal.hide()}> Cancel </LinkButton>
		<Button
			disabled={delete_modal.disabled}
			on:click={async () => await delete_modal.submit()}
		> Delete </Button>
	</svelte:fragment>
</Modal>

<div class="lecture-row">
	<IconButton scale
	  src={trash_icon}
		description="Delete Domain"
		on:click={async () => {
			if (lecture.unchanged) {
				await lecture.delete()
				$graph = $graph // Trigger reactivity
			} else {
				delete_modal.show()
			}
		}}
	/>

	<Textfield 
		id="name"
		placeholder="Lecture name"
		bind:value={lecture.name} 
		on:input={() => $graph = $graph}
		on:change={async () => await lecture.save()}
	/>

	<Button on:click={() => assign_subject_modal.show()}>
		<img src={plus_icon} alt=""> Assign Subject 
	</Button>

	<div class="subjects">
		{#each lecture.subjects as subject}
			<div class="subject">
				{subject.trimmed_name}

				<div class="line" />
	
				<LinkButton
					on:click={async () => {
						lecture.unassignSubject(subject)
						await lecture.save()
						$graph = $graph
					}}
				> Unassign from lecture </LinkButton>
			</div>
		{/each}
	</div>
</div>

<style lang="sass">

	@use 'sass:math'

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$right-gutter: $total-icon-size + $form-small-gap

	.lecture-row
		display: grid
		grid-template: "delete title assign" auto "subjects subjects subjects" auto / $total-icon-size 1fr max-content
		align-items: center
		gap: $form-small-gap

		width: 100%
		padding-right: $right-gutter

		.subjects
			display: flex
			flex-flow: column nowrap
			gap: $form-small-gap

			grid-area: subjects

			width: 100%
			margin-left: math.div($total-icon-size, 2)
			border-left: 1px solid $gray
			padding-left: math.div($total-icon-size, 2) + $form-small-gap + $input-thick-padding
			padding-right: math.div($total-icon-size, 2)

			.subject
				display: flex
				flex-flow: row nowrap
				gap: $form-small-gap

				align-items: center

				.line
					flex-grow: 1
					border: 1px dashed $gray

</style>