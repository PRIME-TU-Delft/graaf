
<script lang="ts">

	// External dependencies
	import { writable } from 'svelte/store'

	// Internal dependencies
	import { ProgramController, CourseController } from '$scripts/controllers'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	// Components
	import Layout from '$components/layouts/DefaultLayout.svelte'
	import Card from '$components/layouts/Card.svelte'
	import Modal from '$components/layouts/Modal.svelte'
	import Button from '$components/buttons/Button.svelte'
	import IconButton from '$components/buttons/IconButton.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'
	import Searchbar from '$components/forms/Search.svelte'
	import Textfield from '$components/forms/Textfield.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import peopleIcon from '$assets/people-icon.svg'

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

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.name.trim() === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() {
			$programs = [...$programs, await ProgramController.create(cache, this.name)]
			this.hide()
		}
	}

	class CourseModal extends BaseModal {
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

		async submit() {
			$courses = [...$courses, await CourseController.create(cache, this.code, this.name)]
			this.hide()
		}
	}

	// Functions
	function courseMatchesQuery(query: string, course: { code: string, name: string }) {
		if (!query) return true

		query = query.toLowerCase()
		let code = course.code.toLowerCase()
		let name = course.name.toLowerCase()

		return code.includes(query) || name.includes(query)
	}

	// Variables
	export let data
	const cache = data.cache
	const programs = writable(data.programs)
	const courses = writable(data.courses)

	const modals: { [key: string]: Modal } = {}
	const sandbox_modal = new SandboxModal()
	const program_modal = new ProgramModal()
	const course_modal = new CourseModal()

	let query = ''

</script>


<!-- Markup -->


<Layout
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		}
	]}
>
	<svelte:fragment slot="header">
		Welcome to your Dashboard! Here you can find all programs and associated courses. Click on any of them to edit or view more information. You can also create a sandbox environment to experiment with the Graph Editor.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		<Button on:click={() => sandbox_modal.show()}>
			<img src={plusIcon} alt="" /> New Sandbox
		</Button>

		<Button on:click={() => program_modal.show()}>
			<img src={plusIcon} alt="" /> New Program
		</Button>

		<Button on:click={() => course_modal.show()}>
			<img src={plusIcon} alt="" /> New Course
		</Button>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search courses" bind:value={query} />

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
	</svelte:fragment>

	<Card>
		<h3 slot="header"> My Courses </h3>

		<svelte:fragment slot="body">
			{#if !$courses.some(course => courseMatchesQuery(query, course))}
				<span class="grayed"> There's nothing here </span>
			{:else}

				<div class="grid">
					{#each $courses as course} <!-- TODO check if course belongs to user -->
						{#if courseMatchesQuery(query, course)}
							<a class="cell" href="./course/{course.id}/overview"> {course.code} {course.name} </a>
						{/if}
				{/each}
				</div>

			{/if}
		</svelte:fragment>
	</Card>

	{#each $programs as program}
		<Card>
			<svelte:fragment slot="header">
				<h3> {program.name} </h3>

				<div class="flex-spacer" />

				<IconButton
					src={peopleIcon}
					description="Program Coordinators"
					on:click={modals[program.name]?.show}
					scale
				/>

				<LinkButton href="./program/{program.id}/settings"> Program settings </LinkButton>

				<Modal bind:this={modals[program.name]}>
					<h3 slot="header"> Program Coordinators </h3>
					<p>
						These are the coordinators of the {program.name} program. You can contact them via email to request
						access to a course.
					</p>
					<ul>
						{#await program.getAdmins() then admins}
							{#each admins as admin}
								<li> {admin.first_name} {admin.last_name} </li>
							{/each}
						{/await}
					</ul>
				</Modal>
			</svelte:fragment>

			<svelte:fragment slot="body">
				{#await program.getCourses() then courses}
					{#if !courses.some(course => courseMatchesQuery(query, course))}
						<span class="grayed"> There's nothing here </span>
					{:else}
						<div class="grid">
							{#each courses as course}
								{#if courseMatchesQuery(query, course)}
									<a class="cell" href="./course/{course.id}/overview"> {course.code} {course.name} </a>
								{/if}
							{/each}
						</div>
					{/if}
				{/await}
			</svelte:fragment>
		</Card>
	{/each}
</Layout>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.grayed
		margin: auto
		color: $placeholder-color

	.grid
		display: flex
		flex-flow: row wrap

		.cell
			flex: 0 1 100%
			padding: 0.5rem

			cursor: pointer
			color: $dark-gray
			transition: color $default-transition

			&:hover
				color: $black
				text-decoration: underline

			&:last-child
				flex-grow: 1

			&:not(:last-child)
				border-bottom: 1px solid $gray

			@media screen and (min-width: 800px)
				border-bottom: 1px solid $gray
				flex-basis: 50%

			@media screen and (min-width: 1200px)
				border-bottom: 1px solid $gray
				flex-basis: 33.3333%

</style>
