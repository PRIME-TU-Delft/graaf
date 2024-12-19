
<script lang="ts">

	// Internal dependencies
	import * as settings from '$scripts/settings'

	import { courses, programs, query } from './stores'
	import { handleError } from '$scripts/utility'
	import { AbstractFormModal } from '$scripts/modals'
	import { CourseController } from '$scripts/controllers'
	import { Validation, Severity } from '$scripts/validation'

	import type { ProgramController } from '$scripts/controllers'

	// Components
	import Grid from './Grid.svelte'

	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import FormModal from '$components/FormModal.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Button from '$components/Button.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import people_icon from '$assets/people-icon.svg'
	import pencil_icon from '$assets/pencil-icon.svg'
	import plus_icon from '$assets/plus-icon.svg'
	import IconButton from '$components/IconButton.svelte';

	// Modals
	class CourseModal extends AbstractFormModal {
		code: string = ''
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			// Validate code
			if (this.hasChanged('code')) {
				if (this.code.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Course code is required'
					})
				} else if (!settings.COURSE_CODE_REGEX.test(this.code.trim())) {
					validation.add({
						severity: Severity.error,
						short: 'Course code is invalid'
					})
				} else if (this.code.trim().length > settings.MAX_COURSE_CODE_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Course code is too long'
					})
				} else if ($courses.some(course => course.code === this.code.trim())) {
					validation.add({
						severity: Severity.error,
						short: 'Course code isn\'t unique'
					})
				}
			}

			// Validate name
			if (this.hasChanged('name')) {
				if (this.name.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Course name is required'
					})
				} else if (this.name.trim().length > settings.MAX_COURSE_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Course name is too long'
					})
				} else if ($courses.some(course => course.trimmed_name === this.name.trim())) {
					validation.add({
						severity: Severity.warning,
						short: 'Course name isn\'t unique'
					})
				}
			}

			return validation
		}

		async submit() {
			try {
				const course = await CourseController.create(program.cache, this.code.trim(), this.name.trim(), program)
				$courses = [...$courses, course] // Trigger reactivity
				$programs = $programs
			} catch (error) {
				handleError(error)
			}
		}
	}

	// Main
	export let program: ProgramController

	const course_modal = new CourseModal()
	let member_modal: SimpleModal

	$: filtered_courses = program.courses.filter(course => course.matchesQuery($query))

</script>

<!-- Markup -->

<FormModal controller={course_modal}>
	<h3 slot="header"> Create Course </h3>

	Courses are the building blocks of your program. They have their own unique code and name, and are associated with a program. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<svelte:fragment slot="form">
		<label for="code"> Course Code </label>
		<Textfield id="code" bind:value={course_modal.code} />

		<label for="name"> Course Name </label>
		<Textfield id="name" bind:value={course_modal.name} />
	</svelte:fragment>

	<svelte:fragment slot="submit"> Create </svelte:fragment>
</FormModal>

<SimpleModal bind:this={member_modal}>
	<h3 slot="header"> Program Admins </h3>
	These are the admins of this program. You can contact them via email to request access to a course.

	<svelte:fragment slot="footer">
		{#if program.admins.length === 0}
			<p class="grayed"> There's nothing here </p>
		{:else}
			<ul>
				{#each program.admins as admin}
					<li> {admin.first_name} {admin.last_name} <span class="email"> {admin.email} </span></li>
				{/each}
			</ul>
		{/if}
	</svelte:fragment>
</SimpleModal>

<Card>
	<svelte:fragment slot="header">
		<h3> {program.display_name} </h3>

		<IconButton
			src={pencil_icon}
			description="Edit program"
			href="./program/{program.id}/settings"
		/>

		<div class="flex-spacer" />

		<LinkButton on:click={member_modal.show}>
			Program Admins
		</LinkButton>

		<Button on:click={() => course_modal.show()}>
			<img src={plus_icon} alt="" /> New Course
		</Button>
	</svelte:fragment>

	{#if filtered_courses.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<Grid>
			{#each filtered_courses as course}
				<a href="./course/{course.id}/overview"> {course.display_name} </a>
			{/each}
		</Grid>	
	{/if}
</Card>