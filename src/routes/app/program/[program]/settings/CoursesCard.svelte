
<script lang="ts">

	// Internal dependencies
	import { program, courses } from './stores'
	import * as settings from '$scripts/settings'

	import { Validation, Severity } from '$scripts/validation'
	import { FormModal } from '$scripts/modals'

	import { CourseController } from '$scripts/controllers'

	// Components
	import CourseRow from './CourseRow.svelte'

	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Modals
	class AssignCourseModal extends FormModal {
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
				assign_course_modal = assign_course_modal // Trigger reactivity
				return
			}

			$program.addCourse(this.course!)
			await $program.save()
			$program = $program // Trigger reactivity
			this.hide()
		}
	}

	class NewCourseModal extends FormModal {
		code: string = ''
		name: string = ''

		get trimmed_code() {
			return this.code.trim()
		}

		get trimmed_name() {
			return this.name.trim()
		}

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			// Validate code
			if (this.hasChanged('code')) {
				if (this.trimmed_code === '') {
					validation.add({
						severity: Severity.error,
						short: 'Course code is required'
					})
				} else if (!settings.COURSE_CODE_REGEX.test(this.trimmed_code)) {
					validation.add({
						severity: Severity.error,
						short: 'Course code is invalid'
					})
				} else if (this.trimmed_code.length > settings.MAX_COURSE_CODE_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Course code is too long'
					})
				} else if ($courses.some(course => course.code === this.trimmed_code)) {
					validation.add({
						severity: Severity.error,
						short: 'Course code isn\'t unique'
					})
				}
			}

			// Validate name
			if (this.hasChanged('name')) {
				if (this.trimmed_name === '') {
					validation.add({
						severity: Severity.error,
						short: 'Course name is required'
					})
				} else if (this.trimmed_name.length > settings.MAX_COURSE_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Course name is too long'
					})
				} else if ($courses.some(course => course.name === this.trimmed_name)) {
					validation.add({
						severity: Severity.warning,
						short: 'Course name isn\'t unique'
					})
				}
			}

			return validation
		}

		async submit() {
			this.touchAll()
			if (this.validate().severity === Severity.error) {
				new_course_modal = new_course_modal // Trigger reactivity
				return
			}

			// Create course
			const course = await CourseController.create($program.cache, this.trimmed_code, this.trimmed_name, $program)
			$courses = [...$courses, course] // Trigger reactivity
			$program = $program
			this.hide()
		}
	}

	// Variables
	let assign_course_modal = new AssignCourseModal()
	let new_course_modal = new NewCourseModal()
	let query: string = ''

	$: filtered_courses = $program.courses.filter(course => course.matchesQuery(query))

</script>

<Modal bind:this={new_course_modal.modal}>
	<h3 slot="header"> Assign New Course </h3>
	Courses are the building blocks of your program. They have their own unique code and name, and can be part of a program. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<form>
		<label for="code"> Course Code </label>
		<Textfield id="code" bind:value={new_course_modal.code} />

		<label for="name"> Course Name </label>
		<Textfield id="name" bind:value={new_course_modal.name} />

		<footer>
			<Button
				disabled={new_course_modal.validate().severity === Severity.error}
				on:click={async () => await new_course_modal.submit()}
			> Create </Button>
			<Feedback data={new_course_modal.validate()} />
		</footer>
	</form>
</Modal>

<Modal bind:this={assign_course_modal.modal}>
	<h3 slot="header"> Assign Existing Course </h3>
	Assign an existing course to this program. Programs are collections of courses that are related to each other in some way.

	<form>
		<label for="program"> Target Program </label>

		<Dropdown
			id="program"
			placeholder="Select a program"
			bind:value={assign_course_modal.course}
			options={$program.course_options}
		/>

		<footer>
			<Button
				disabled={assign_course_modal.validate().severity === Severity.error}
				on:click={async () => await assign_course_modal.submit()}
			> Assign </Button>
			<Feedback data={assign_course_modal.validate()} />
		</footer>
	</form>
</Modal>

<Card>
	<svelte:fragment slot="header">
		<h3> Courses </h3>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search courses" bind:value={query} />
		<Button on:click={() => assign_course_modal.show()}>
			<img src={plus_icon} alt=""> Assign course
		</Button>
		<Button on:click={() => new_course_modal.show()}>
			<img src={plus_icon} alt=""> New course
		</Button>
	</svelte:fragment>

	{#if filtered_courses.length === 0}
		<p class="grayed"> There's nothing here </p>
	{/if}

	{#each filtered_courses as course}
		<CourseRow {course} />
	{/each}
</Card>
