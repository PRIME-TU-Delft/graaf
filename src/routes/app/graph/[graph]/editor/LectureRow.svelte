
<script lang="ts">

	// Internal dependencies
	import { graph } from './stores'

	import { AbstractFormModal } from '$scripts/modals'
	import { Validation, Severity } from '$scripts/validation'

	import type {
		LectureController,
		SubjectController
	} from '$scripts/controllers'

	// Components
	import SimpleModal from '$components/SimpleModal.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import FormModal from '$components/FormModal.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'
	import plus_icon from '$assets/plus-icon.svg'

	// Modals
	class AssignSubjectModal extends AbstractFormModal {
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
			lecture.assignSubject(this.subject as SubjectController)
			await lecture.save()
			$graph = $graph
		}
	}

	// Main
	export let lecture: LectureController
	const assign_subject_modal = new AssignSubjectModal()
	let delete_modal: SimpleModal

</script>

<!-- Markup -->

<FormModal controller={assign_subject_modal}>
	<h3 slot="header"> Assign Subject </h3>
	Assign a subject to this lecture.

	<svelte:fragment slot="form">
		<label for="subject"> Target Subject </label>
		<Dropdown
			id="subject"
			placeholder="Select a subject"
			options={lecture.subject_options}
			bind:value={assign_subject_modal.subject}
		/>
	</svelte:fragment>

	<svelte:fragment slot="submit">
		Assign
	</svelte:fragment>
</FormModal>

<SimpleModal bind:this={delete_modal}>
	<h3 slot="header"> Delete Lecture </h3>
	Are you sure you want to delete this lecture? This action cannot be undone.

	<svelte:fragment slot="footer">
		<LinkButton
			on:click={() => delete_modal.hide()}
		> Cancel </LinkButton>
		<Button
			on:click={async () => {
				await lecture.delete()
				$graph = $graph // Trigger reactivity
			}}
		> Delete </Button>
	</svelte:fragment>
</SimpleModal>

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

	{#if lecture.present_subjects.length > 0}
		<div class="subjects">
			{#each lecture.present_subjects as subject}
				<div class="subject">
					{#if subject.trimmed_name.length > 0}
						{subject.trimmed_name}
					{:else}
						<i> Unnamed subject </i>
					{/if}

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
	{/if}
</div>

<!-- Styles -->

<style lang="sass">

	@use 'sass:math'

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.lecture-row
		display: grid
		grid-template: "delete title assign" auto "subjects subjects subjects" auto / $total-icon-size 1fr max-content
		align-items: center
		column-gap: $form-small-gap

		width: 100%
		padding-right: $total-icon-size + $form-small-gap

		.subjects
			display: flex
			flex-flow: column nowrap
			gap: $form-small-gap

			grid-area: subjects

			margin-top: $form-small-gap
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