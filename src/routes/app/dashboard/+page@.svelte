
<script lang="ts">

	// Internal dependencies
	import { cache, programs, courses, search_query } from './stores'
	
	import { ProgramController, CourseController } from '$scripts/controllers'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	// Components
	import Layout from '$routes/app/+layout.svelte'

	import Validation from '$components/Validation.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Searchbar from '$components/Search.svelte'
	import Navbar from '$components/Navbar.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	import CoursesCard from './CoursesCard.svelte'
	import ProgramCard from './ProgramCard.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Helpers
	class SandboxModal extends BaseModal {
		code: string = ''
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.code.trim() === '') {
				result.add({
					severity: Severity.error,
					short: 'Code is required'
				})
			}

			if (this.name.trim() === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() { }
	}

	class ProgramModal extends BaseModal {
		name: string = ''

		get trimmed_name() {
			return this.name.trim()
		}

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.trimmed_name === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			} else if ($programs.some(program => program.name === this.trimmed_name)) {
				result.add({
					severity: Severity.error,
					short: 'Program with this name already exists'
				})
			}

			return result
		}

		async submit() {
			const program = await ProgramController.create($cache, this.trimmed_name)
			programs.update(programs => [...programs, program])
			this.hide()
		}
	}

	class CourseModal extends BaseModal {
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

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.trimmed_code === '') {
				result.add({
					severity: Severity.error,
					short: 'Code is required'
				})
			} else if ($courses.some(course => course.code === this.trimmed_code)) {
				result.add({
					severity: Severity.error,
					short: 'Course with this code already exists'
				})
			}

			if (this.trimmed_name === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() {
			const course = await CourseController.create($cache, this.trimmed_code, this.trimmed_name)
			courses.update(courses => [...courses, course])
			this.hide()
		}
	}

	// Modals
	const sandbox_modal = new SandboxModal()
	const program_modal = new ProgramModal()
	const course_modal = new CourseModal()

</script>


<!-- Markup -->


<Layout>
	<svelte:fragment slot="title">
		<Navbar path={[{ name: 'Dashboard', href: '/app/dashboard' }]} />
		Welcome to your Dashboard! Here you can find all programs and associated courses. Click on any of them to edit or view more information. You can also create a sandbox environment to experiment with the Graph Editor.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		<Button on:click={() => sandbox_modal.show()}>
			<img src={plus_icon} alt="" /> New Sandbox
		</Button>

		<Button on:click={() => program_modal.show()}>
			<img src={plus_icon} alt="" /> New Program
		</Button>

		<Button on:click={() => course_modal.show()}>
			<img src={plus_icon} alt="" /> New Course
		</Button>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search courses" bind:value={$search_query} />
	</svelte:fragment>

	<CoursesCard />

	{#each $programs as program}
		<ProgramCard {program} />
	{/each}
</Layout>

<Modal bind:this={sandbox_modal.modal}>
	<h3 slot="header"> Create Sandbox </h3>

	Sandboxes are environments where you can experiment with the Graph editor. They are not associated with any program or course.

	<form>
		<label for="code"> Sandbox Code </label>
		<Textfield id="code" bind:value={sandbox_modal.code} />

		<label for="name"> Sandbox Name </label>
		<Textfield id="name" bind:value={sandbox_modal.name} />

		<footer>
			<Button
				disabled={!sandbox_modal.validate().okay()}
				on:click={() => sandbox_modal.submit()}
			> Create </Button>
			<Validation data={sandbox_modal.validate()} />
		</footer>
	</form>
</Modal>

<Modal bind:this={program_modal.modal}>
	<h3 slot="header"> Create Program </h3>

	Programs are collections of courses, usually pertaining to the same field of study. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<form>
		<label for="name"> Program Name </label>
		<Textfield id="name" bind:value={program_modal.name} />

		<footer>
			<Button
				disabled={!program_modal.validate().okay()}
				on:click={() => program_modal.submit()}
			> Create </Button>
			<Validation data={program_modal.validate()} />
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
				disabled={!course_modal.validate().okay()}
				on:click={() => course_modal.submit()}
			> Create </Button>
			<Validation data={course_modal.validate()} />
		</footer>
	</form>
</Modal>


<!-- Styles -->


<style lang="sass">

	@import './style.sass'

</style>