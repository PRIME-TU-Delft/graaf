

<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import { programs, courses } from './stores'

	import { Validation, Severity } from '$scripts/validation'
	import { FormModal } from '$scripts/modals'

	import {
		ControllerCache,
		ProgramController,
		CourseController,
		UserController
	} from '$scripts/controllers'

	// Components
	import CoursesCard from './CoursesCard.svelte'
	import ProgramCard from './ProgramCard.svelte'

	import Textfield from '$components/Textfield.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Loading from '$components/Loading.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Helpers
	class ProgramModal extends FormModal {
		name: string = ''

		get trimmed_name() {
			return this.name.trim()
		}

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			// Validate name
			if (this.hasChanged('name')) {
				if (this.trimmed_name === '') {
					validation.add({
						severity: Severity.error,
						short: 'Program name is required'
					})
				} else if (this.trimmed_name.length > settings.MAX_PROGRAM_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Program name is too long'
					})
				} else if ($programs.some(program => program.name === this.trimmed_name)) {
					validation.add({
						severity: Severity.error,
						short: 'Program name isn\'t unique'
					})
				}
			}

			return validation
		}

		async submit() {
			this.touchAll()
			if (this.validate().severity === Severity.error) {
				program_modal = program_modal // Trigger reactivity
				return
			}

			// Create program
			const program = await ProgramController.create(cache, this.trimmed_name)
			$programs = [...$programs, program] // Trigger reactivity
			this.hide()
		}
	}

	class CourseModal extends FormModal {
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
				course_modal = course_modal // Trigger reactivity
				return
			}

			// Create course
			const course = await CourseController.create(cache, this.trimmed_code, this.trimmed_name)
			$courses = [...$courses, course] // Trigger reactivity
			this.hide()
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

	// Initialization
	export let data: PageData
	const cache = new ControllerCache()

	// Modals
	let program_modal = new ProgramModal()
	let course_modal = new CourseModal()

	// Variables
	let query: string = ''

</script>


<!-- Markup -->


<Modal bind:this={program_modal.modal}>
	<h3 slot="header"> Create Program </h3>

	Programs are collections of Courses, usually pertaining to the same field of study. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<form>
		<label for="name"> Program Name </label>
		<Textfield id="name" bind:value={program_modal.name} />

		<footer>
			<Button
				disabled={program_modal.validate().severity === Severity.error}
				on:click={async () => await program_modal.submit()}
			> Create </Button>
			<Feedback data={program_modal.validate()} />
	</footer>
	</form>
</Modal>

<Modal bind:this={course_modal.modal}>
	<h3 slot="header"> Create Course </h3>

	Courses are the building blocks of your program. They have their own unique code and name, and are associated with a program. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<form>
		<label for="code"> Course Code </label>
		<Textfield id="code" bind:value={course_modal.code} />

		<label for="name"> Course Name </label>
		<Textfield id="name" bind:value={course_modal.name} />

		<footer>
			<Button
				disabled={course_modal.validate().severity === Severity.error}
				on:click={async () => await course_modal.submit()}
			> Create </Button>
			<Feedback data={course_modal.validate()} />
		</footer>
	</form>
</Modal>

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

			<Searchbar placeholder="Search courses" bind:value={query} />
		</svelte:fragment>

		<CoursesCard {query} />

		{#each $programs as program}
			<ProgramCard {program} {query} />
		{/each}
	</Layout>
{/await}