
<script lang="ts">

	// Internal dependencies
	import { program } from './stores'

	import { Validation, Severity } from '$scripts/validation'
	import { FormModal } from '$scripts/modals'

	import type { CourseController } from '$scripts/controllers'

	// Components
	import CourseRow from './CourseRow.svelte'

	import Searchbar from '$components/Searchbar.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Modals
	class AddCourseModal extends FormModal {
		course: CourseController | null = null

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			if (this.hasChanged('course')) {
				if (this.course === null) {
					validation.add({
						severity: Severity.error,
						short: 'Course is required'
					})
				}
			}

			return validation
		}

		async submit() {
			this.touchAll()
			if (this.validate().severity === Severity.error) {
				course_modal = course_modal // Trigger reactivity
				return
			}

			$program.addCourse(this.course!)
			await $program.save()
			$program = $program // Trigger reactivity
			this.hide()
		}
	}



	// Variables
	let course_modal = new AddCourseModal()
	let query: string = ''

	$: filtered_courses = $program.courses.filter(course => course.matchesQuery(query))

</script>

<Modal bind:this={course_modal.modal}>
	<h3 slot="header"> Assign to Program </h3>
	Assign this course to a program. Programs are collections of courses that are related to each other in some way.

	<form>
		<label for="program"> Target Program </label>

		<Dropdown
			id="program"
			placeholder="Target Program"
			bind:value={course_modal.course}
			options={$program.course_options}
		/>

		<footer>
			<Button
				disabled={course_modal.validate().severity === Severity.error}
				on:click={async () => await course_modal.submit()}
			> Assign </Button>
			<Feedback data={course_modal.validate()} />
		</footer>
	</form>
</Modal>

<Card>
	<svelte:fragment slot="header">
		<h3> Courses </h3>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search courses" bind:value={query} />
		<Button on:click={() => course_modal.show()}>
			<img src={plus_icon} alt=""> Assign course
		</Button>
	</svelte:fragment>

	{#if filtered_courses.length === 0}
		<p class="grayed"> There's nothing here </p>
	{/if}

	{#each filtered_courses as course}
		<CourseRow {course} />
	{/each}
</Card>
