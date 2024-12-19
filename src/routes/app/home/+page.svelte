
<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import { programs, courses, query } from './stores'
	import { handleError } from '$scripts/utility'

	import { Validation, Severity } from '$scripts/validation'
	import { AbstractFormModal } from '$scripts/modals'

	import {
		ControllerCache,
		ProgramController,
		CourseController,
		UserController
	} from '$scripts/controllers'

	// Components
	import CoursesCard from './CoursesCard.svelte'
	import ProgramCard from './ProgramCard.svelte'

	import FormModal from '$components/FormModal.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Loading from '$components/Loading.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Modals
	class ProgramModal extends AbstractFormModal {
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			// Validate name
			if (this.hasChanged('name')) {
				if (this.name.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Program name is required'
					})
				} else if (this.name.trim().length > settings.MAX_PROGRAM_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Program name is too long'
					})
				} else if ($programs.some(program => program.trimmed_name === this.name.trim())) {
					validation.add({
						severity: Severity.error,
						short: 'Program name isn\'t unique'
					})
				}
			}

			return validation
		}

		async submit() {
			try {
				const program = await ProgramController.create(cache, this.name.trim())
				$programs = [...$programs, program] // Trigger reactivity
			} catch (error) {
				handleError(error)
			}
		}
	}

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
				const course = await CourseController.create(cache, this.code.trim(), this.name.trim())
				$courses = [...$courses, course] // Trigger reactivity
			} catch (error) {
				handleError(error)
			}
		}
	}

	// Functions
	async function revive() {
		
		// Await all promises
		const [
			awaited_courses,
			awaited_programs,
			awaited_admins
		] = await Promise.all([
			data.courses,
			data.programs,
			data.admins
		])

		// Revive controllers into stores
		programs.set(awaited_programs.map(program => ProgramController.revive(cache, program)))
		courses.set(awaited_courses.map(course => CourseController.revive(cache, course)))
		
		// Revive controllers into cache
		awaited_admins.forEach(admin => UserController.revive(cache, admin))
	}

	// Main
	export let data: PageData

	const program_modal = new ProgramModal()
	const course_modal = new CourseModal()
	const cache = new ControllerCache()

</script>

<!-- Markup -->

<FormModal controller={program_modal}>
	<h3 slot="header"> Create Program </h3>

	Programs are collections of Courses, usually pertaining to the same field of study. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<svelte:fragment slot="form">
		<label for="name"> Program Name </label>
		<Textfield id="name" bind:value={program_modal.name} />
	</svelte:fragment>

	<svelte:fragment slot="submit"> Create </svelte:fragment>
</FormModal>

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

{#await revive()}
	<Loading />
{:then} 
	<Layout>
		<svelte:fragment slot="title">
			<Navbar path={[{ name: 'Home' }]} />
			Here you can find all Programs and associated Courses. Click on any of them to edit or view
			more information. You can also create a sandbox environment to experiment with the Graph Editor. Can't find a specific
			Program or Course? Maybe you don't have access to it. Contact one of its Admins to get access.
		</svelte:fragment>

		<svelte:fragment slot="toolbar">
			<Button on:click={() => program_modal.show()}>
				<img src={plus_icon} alt="" /> New Program
			</Button>

			<Button on:click={() => course_modal.show()}>
				<img src={plus_icon} alt="" /> New Course
			</Button>

			<div class="flex-spacer" />

			<Searchbar placeholder="Search courses" bind:value={$query} />
		</svelte:fragment>

		<CoursesCard />

		{#each $programs as program}
			<ProgramCard {program} />
		{/each}
	</Layout>
{/await}