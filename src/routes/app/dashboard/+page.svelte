
<script lang="ts">

	// Svelte imports
	import { enhance } from '$app/forms'

	// Internal imports
	import { ValidationData, Severity, BaseModal } from '$scripts/entities'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte'
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Search.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
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

			if (this.code.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Code is required'
				})
			}

			if (this.name.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}
	}

	class ProgramModal extends BaseModal {
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.name.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}
	}

	class CourseModal extends BaseModal {
		code: string = ''
		name: string = ''
		program?: number

		constructor() {
			super()
			this.initialize()
		}

		get program_options() {
			return data.programs.map(program => {
				return {
					name: program.name,
					value: program.id,
					validation: ValidationData.success()
				}
			})
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.code.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Code is required'
				})
			}

			if (this.name.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			if (this.program === undefined) {
				result.add({
					severity: Severity.error,
					short: 'Program is required'
				})
			}

			return result
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
	$: courses = data.courses
	$: programs = data.programs

	const modals: { [key: string]: Modal } = {}
	const sandbox: SandboxModal = new SandboxModal()
	const program: ProgramModal = new ProgramModal()
	const course: CourseModal = new CourseModal()

	let query: string = ''

</script>


<!-- Markup -->


<Layout
	description="Welcome to your Dashboard! Here you can find all programs and associated courses. Click on any of them to edit or view more information. You can also create a sandbox environment to experiment with the Graph Editor."
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Button on:click={() => sandbox.show()}>
			<img src={plusIcon} alt="" /> New Sandbox
		</Button>

		<Button on:click={() => program.show()}>
			<img src={plusIcon} alt="" /> New Program
		</Button>

		<Button on:click={() => course.show()}>
			<img src={plusIcon} alt="" /> New Course
		</Button>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search courses" bind:value={query} />

		<Modal bind:this={sandbox.modal}>
			<h3 slot="header"> Create Sandbox </h3>

			Sandboxes are environments where you can experiment with the Graph editor. They are not associated with any program or course.

			<form method="POST" action="?/newSandbox" use:enhance={() => sandbox.hide()}>
				<label for="code"> Sandbox Code </label>
				<Textfield label="Code" bind:value={sandbox.code} />

				<label for="name"> Sandbox Name </label>
				<Textfield label="Name" bind:value={sandbox.name} />

				<footer>
					<Button submit disabled={sandbox.validate().severity === Severity.error} > Create </Button>
					<Validation data={sandbox.validate()} />
				</footer>
			</form>
		</Modal>

		<Modal bind:this={program.modal}>
			<h3 slot="header"> Create Program </h3>

			Programs are collections of courses, usually pertaining to the same field of study. Looking to try out the Graph editor? Try making a sandbox environment instead!

			<form method="POST" action="?/newProgram" use:enhance={() => program.hide()}>
				<label for="name"> Program Name </label>
				<Textfield label="Name" bind:value={program.name} />

				<footer>
					<Button submit disabled={program.validate().severity === Severity.error} > Create </Button>
					<Validation data={program.validate()} />
				</footer>
			</form>
		</Modal>

		<Modal bind:this={course.modal}>
			<h3 slot="header"> Create Course </h3>

			Courses are the building blocks of your program. They have their own unique code and name, and are associated with a program. Looking to try out the Graph editor? Try making a sandbox environment instead!

			<form method="POST" action="?/newCourse" use:enhance={() => course.hide()}>
				<label for="code"> Course Code </label>
				<Textfield label="Code" bind:value={course.code} />

				<label for="name"> Course Name </label>
				<Textfield label="Name" bind:value={course.name} />

				<label for="program"> Program </label>
				<Dropdown
					label="Program"
					placeholder="Select a program"
					options={course.program_options}
					bind:value={course.program}
				/>

				<footer>
					<Button submit disabled={course.validate().severity === Severity.error} > Create </Button>
					<Validation data={course.validate()} />
				</footer>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header"> My Courses </h3>

		<svelte:fragment slot="body">
			{#if !courses.some(course => courseMatchesQuery(query, course))}
				<span class="grayed"> There's nothing here </span>
			{:else}

				<div class="grid">
					{#each courses as { code, name }}
						{#if courseMatchesQuery(query, { code, name })}
							<a class="cell" href="./course/{code}/overview"> {code} {name} </a>
						{/if}
					{/each}
				</div>

			{/if}
		</svelte:fragment>
	</Card>

	{#each programs as { name, courses, coordinators }}
		<Card>
			<svelte:fragment slot="header">
				<h3> {name} </h3>

				<div class="flex-spacer" />

				<IconButton
					src={peopleIcon}
					description="Program Coordinators"
					on:click={modals[name]?.show}
					scale
				/>

				<LinkButton href="./program/{name}/settings"> Program settings </LinkButton>

				<Modal bind:this={modals[name]}>
					<h3 slot="header"> Program Coordinators </h3>
					<p>
						These are the coordinators of the {name} program. You can contact them via email to request
						access to a course.
					</p>
					<ul>
						{#each coordinators as coordinator}
							<li> {coordinator} </li>
						{/each}
					</ul>
				</Modal>
			</svelte:fragment>

			<svelte:fragment slot="body">
				{#if !courses.some(course => courseMatchesQuery(query, course))}
					<span class="grayed"> There's nothing here </span>
				{:else}

					<div class="grid">
						{#each courses as { code, name }}
							{#if courseMatchesQuery(query, { code, name })}
								<a class="cell" href="./course/{code}/overview"> {code} {name} </a>
							{/if}
						{/each}
					</div>

				{/if}
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
