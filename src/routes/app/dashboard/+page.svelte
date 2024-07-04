
<script lang="ts">

	// Svelte imports
	import { enhance } from '$app/forms'

	// Internal imports
	import { ValidationData, Severity } from '$scripts/entities'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte'
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import peopleIcon from '$assets/people-icon.svg'

	// Helpers
	class Sandbox {
		code: string = ''
		name: string = ''

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

		canSubmit() {
			return this.code.length > 0 && this.name.length > 0
		}
	}

	class Program {
		name: string = ''

		get options() {
			return data.programs.map(program => {
				return { name: program.name, value: program.id, validation: ValidationData.success() }
			})
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

		canSubmit() {
			return this.name.length > 0
		}
	}

	class Course {
		code: string = ''
		name: string = ''
		program?: number

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

		canSubmit() {
			return this.code.length > 0 && this.name.length > 0 && this.program !== undefined
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

	const sandbox: Sandbox = new Sandbox()
	const program: Program = new Program()
	const course: Course = new Course()

	const modals: { [key: string]: Modal } = {}
	let sandbox_modal: Modal
	let program_modal: Modal
	let course_modal: Modal
	
	let query: string = ''

</script>


<!-- Markup -->


<Layout
	description="Welcome to your Dashboard! Here you can find all programs and associated courses. Click on any of them to edit or view more information. You can also create a sandbox environment to expermient with the Graph Editor."
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Button on:click={sandbox_modal?.show}>
			<img src={plusIcon} alt="" /> New Sandbox
		</Button>

		<Button on:click={program_modal?.show}>
			<img src={plusIcon} alt="" /> New Program
		</Button>

		<Button on:click={course_modal?.show}>
			<img src={plusIcon} alt="" /> New Course
		</Button>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search courses" bind:value={query} />

		<Modal bind:this={sandbox_modal}>
			<h3 slot="header"> Create Sandbox </h3>

			Sandboxes are environments where you can experiment with the Graph editor. They are not associated with any program or course.

			<form method="POST" action="?/newSandbox" use:enhance={sandbox_modal?.hide}>
				<label for="code"> Code </label>
				<Textfield label="Code" bind:value={sandbox.code} />

				<label for="name"> Name </label>
				<Textfield label="Name" bind:value={sandbox.name} />

				<footer>
					<Button submit disabled={!sandbox.canSubmit()} > Create </Button>
					<Validation data={sandbox.validate()} />
				</footer>
			</form>
		</Modal>

		<Modal bind:this={program_modal}>
			<h3 slot="header"> Create Program </h3>

			Programs are collections of courses, usually pertaining to the same field of study. Looking to try out the Graph editor? Try making a sandbox environment instead!

			<form method="POST" action="?/newProgram" use:enhance={program_modal?.hide}>
				<label for="name"> Name </label>
				<Textfield label="Name" bind:value={program.name} />

				<footer>
					<Button submit disabled={!program.canSubmit()} > Create </Button>
					<Validation data={program.validate()} />
				</footer>
			</form>
		</Modal>

		<Modal bind:this={course_modal}>
			<h3 slot="header"> Create Course </h3>

			Courses are the building blocks of your program. They have their own unique code and name, and are associated with a program. Looking to try out the Graph editor? Try making a sandbox environment instead!

			<form method="POST" action="?/newCourse" use:enhance={course_modal?.hide}>
				<label for="code"> Code </label>
				<Textfield label="Code" bind:value={course.code} />

				<label for="name"> Name </label>
				<Textfield label="Name" bind:value={course.name} />

				<label for="program"> Program </label>
				<Dropdown
					label="Program"
					placeholder="Select a program"
					options={program.options}
					bind:value={course.program}
				/>

				<footer>
					<Button submit disabled={!course.canSubmit()} > Create </Button>
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

				<LinkButton href="./program/{name}/settings">Settings</LinkButton>

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
