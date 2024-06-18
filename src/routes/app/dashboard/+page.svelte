
<script lang="ts">

	// Svelte imports
	import { enhance } from '$app/forms'

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

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import peopleIcon from '$assets/people-icon.svg'
	import { ValidationData } from '$scripts/entities/ValidationData.js';

	// Exports
	export let data

	// Variables
	const modals: { [key: string]: Modal } = {}
	var createProgramModal: Modal
	var createCourseModal: Modal

	$: courses = data.courses
	$: programs = data.programs
	$: programOptions = programs.map(program => {
		return { name: program.name, value: program.id, validation: new ValidationData() }
	})

	function onSearch(event: Event) {
		// TODO add onSearch event
	}

	function newSandbox() {
		// TODO add newSandbox function
	}

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
		<Button on:click={newSandbox}>
			<img src={plusIcon} alt="" /> New Sandbox
		</Button>

		<Button on:click={createProgramModal?.show}>
			<img src={plusIcon} alt="" /> New Program
		</Button>

		<Button on:click={createCourseModal?.show}>
			<img src={plusIcon} alt="" /> New Course
		</Button>

		<div class="flex-spacer" />

		<Searchbar on:input={onSearch} placeholder="Search courses" />

		<Modal bind:this={createProgramModal}>
			<h3 slot="header"> Create Program </h3>

			<form method="POST" action="?/newProgram" use:enhance={createProgramModal?.hide}>
				<label for="name"> Name </label>
				<Textfield label="Name" />

				<Button submit> Create </Button>
			</form>
		</Modal>

		<Modal bind:this={createCourseModal}>
			<h3 slot="header"> Create Course </h3>

			<form method="POST" action="?/newCourse" use:enhance={createCourseModal?.hide}>
				<label for="code"> Code </label>
				<Textfield label="Code" />

				<label for="name"> Name </label>
				<Textfield label="Name" />

				<label for="program"> Program </label>
				<Dropdown
					label="Program"
					placeholder="Select a program"
					options={programOptions}
				/>

				<Button submit> Create </Button>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header"> My Courses </h3>
		<div slot="body" class="grid">
			{#each courses as { code, name }}
				<a class="cell" href="./course/{code}/overview"> {code} {name} </a>
			{/each}
		</div>
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

			<div slot="body" class="grid">
				{#each courses as { code, name }}
					<a class="cell" href="./course/{code}/overview"> {code} {name} </a>
				{/each}
			</div>
		</Card>
	{/each}
</Layout>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	form
		display: grid
		grid-template: "label content" auto / 1fr 2fr
		place-items: center start

		label
			grid-column: label
			justify-self: end

			margin-top: $form-small-gap
			padding-right: $form-medium-gap

		:global(.textfield), :global(.dropdown)
			grid-column: content
			margin-top: $form-small-gap

		:global(.button)
			grid-column: content
			margin-top: $form-big-gap

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
