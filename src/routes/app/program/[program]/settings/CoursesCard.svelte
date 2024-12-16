<script lang="ts">
	// Internal dependencies
	import { program, courses } from './stores';
	import * as settings from '$scripts/settings';

	import { Validation, Severity } from '$scripts/validation';
	import { AbstractFormModal } from '$scripts/modals';

	import { CourseController } from '$scripts/controllers';

	// Components
	import CourseRow from './CourseRow.svelte';

	import FormModal from '$components/FormModal.svelte';
	import Searchbar from '$components/Searchbar.svelte';
	import Textfield from '$components/Textfield.svelte';
	import Dropdown from '$components/Dropdown.svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';

	// Assets
	import plus_icon from '$assets/plus-icon.svg';

	// Modals
	class AssignCourseModal extends AbstractFormModal {
		course: CourseController | null = null;

		constructor() {
			super();
			this.initialize();
		}

		validate(): Validation {
			const validation = new Validation();

			if (this.hasChanged('course')) {
				if (this.course === null) {
					validation.add({
						severity: Severity.error,
						short: 'Course is required'
					});
				}
			}

			return validation;
		}

		async submit() {
			$program.assignCourse(this.course as CourseController);
			await $program.save();
			$program = $program; // Trigger reactivity
		}
	}

	class NewCourseModal extends AbstractFormModal {
		code: string = '';
		name: string = '';

		constructor() {
			super();
			this.initialize();
		}

		validate(): Validation {
			const validation = new Validation();

			// Validate code
			if (this.hasChanged('code')) {
				if (this.code.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Course code is required'
					});
				} else if (!settings.COURSE_CODE_REGEX.test(this.code.trim())) {
					validation.add({
						severity: Severity.error,
						short: 'Course code is invalid'
					});
				} else if (this.code.trim().length > settings.MAX_COURSE_CODE_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Course code is too long'
					});
				} else if ($courses.some((course) => course.code === this.code.trim())) {
					validation.add({
						severity: Severity.error,
						short: "Course code isn't unique"
					});
				}
			}

			// Validate name
			if (this.hasChanged('name')) {
				if (this.name.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Course name is required'
					});
				} else if (this.name.trim().length > settings.MAX_COURSE_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Course name is too long'
					});
				} else if ($courses.some((course) => course.trimmed_name === this.name.trim())) {
					validation.add({
						severity: Severity.warning,
						short: "Course name isn't unique"
					});
				}
			}

			return validation;
		}

		async submit() {
			const course = await CourseController.create(
				$program.cache,
				this.code.trim(),
				this.name.trim(),
				$program
			);
			$courses = [...$courses, course]; // Trigger reactivity
			$program = $program;
		}
	}

	// Main
	const assign_course_modal = $state(new AssignCourseModal());
	const new_course_modal = $state(new NewCourseModal());

	let query: string = $state('');

	let filtered_courses = $derived($program.courses.filter((course) => course.matchesQuery(query)));
</script>

<FormModal controller={new_course_modal}>
	{#snippet header()}
		<h3>Assign New Course</h3>
	{/snippet}
	Courses are the building blocks of your program. They have their own unique code and name, and can
	be part of a program. Looking to try out the Graph editor? Try making a sandbox environment instead!

	{#snippet form()}
		<label for="code"> Course Code </label>
		<Textfield id="code" bind:value={new_course_modal.code} />

		<label for="name"> Course Name </label>
		<Textfield id="name" bind:value={new_course_modal.name} />
	{/snippet}

	{#snippet submit()}
		Create and Assign
	{/snippet}
</FormModal>

<FormModal controller={assign_course_modal}>
	{#snippet header()}
		<h3>Assign Existing Course</h3>
	{/snippet}
	Assign an existing course to this program. Programs are collections of courses that are related to
	each other in some way.

	{#snippet form()}
		<label for="program"> Target Program </label>
		<Dropdown
			placeholder="Select a program"
			bind:value={assign_course_modal.course}
			options={$program.course_options}
		/>
	{/snippet}

	{#snippet submit()}
		Assign
	{/snippet}
</FormModal>

<Card>
	{#snippet header()}
		<h3>Courses</h3>

		<div class="flex-spacer"></div>

		<Searchbar placeholder="Search courses" bind:value={query} />
		<Button onclick={() => assign_course_modal.show()}>
			<img src={plus_icon} alt="" /> Assign course
		</Button>
		<Button onclick={() => new_course_modal.show()}>
			<img src={plus_icon} alt="" /> New course
		</Button>
	{/snippet}

	{#if filtered_courses.length === 0}
		<p class="grayed">There's nothing here</p>
	{/if}

	{#each filtered_courses as course}
		<CourseRow {course} />
	{/each}
</Card>
