
<!-- Script -->

<script lang="ts">

	import { enhance } from '$app/forms';

	import Layout from '$layouts/DefaultLayout.svelte';
	import Card from '$components/Card.svelte';
	import Modal from '$components/Modal.svelte';
	import Row from '$layouts/RowLayout.svelte';
	import Button from '$components/Button.svelte';
	import IconButton from '$components/IconButton.svelte';
	import Searchbar from '$components/Searchbar.svelte';
	import Textfield from '$components/Textfield.svelte';
	import Tooltip from '$components/Tooltip.svelte';

	import plusIcon from '$assets/plus-icon.svg';
	import peopleIcon from '$assets/people-icon.svg';
	import LinkButton from '$components/LinkButton.svelte';

	export let data;
	$: courses = data.courses;
	$: programs = data.programs;

	function onSearch(event: Event) {
		// TODO add onSearch event
	}

	function newSandbox() {
		// TODO add newSandbox function
	}

	function newCourse() {
		// TODO add newCourse function
	}

	function newProgram() {
		// TODO add newProgram function
	}

	const modals: { [key: string]: Modal | null } = {};

</script>

<!-- Markup -->

<Layout
	description="Welcome to your Dashboard! Here you can find all programs and associated courses. Click on any of them to edit or view more information. You can also create a sandbox environment to expermient with the Graph Editor."
	path={[
		{
			name: "Dashboard",
			href: "/dashboard"
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<Button callback={newSandbox}>
			<img src={plusIcon} alt="Plus icon"> New Sandbox
		</Button>

		<Button callback={modals.CREATE_COURSE?.show}>
			<img src={plusIcon} alt="Plus icon"> New Course
		</Button>

		<Button callback={modals.CREATE_PROGRAM?.show}>
			<img src={plusIcon} alt="Plus icon"> New Program
		</Button>

		<div class="flex-spacer" />

		<Searchbar onChange={onSearch} placeholder="Search courses" />
		
		<Modal bind:this={modals["CREATE_COURSE"]}>
			<h3 slot="header"> Create Course </h3>

			<form method="POST" action="?/newCourse" use:enhance>
				<Textfield label="Code"/>
				<Textfield label="Name"/>
				<Textfield label="Program ID"/>
				<Row><svelte:fragment slot="right">
					<Button submit={true} callback={modals.CREATE_COURSE?.hide}> Create </Button>
				</svelte:fragment></Row>
			</form>
		</Modal>

		<Modal bind:this={modals["CREATE_PROGRAM"]}>
			<h3 slot="header"> Create Program </h3>

			<form method="POST" action="?/newProgram" use:enhance>
				<Textfield label="Name"/>
				<Row><svelte:fragment slot="right">
					<Button submit={true} callback={modals.CREATE_PROGRAM?.hide}> Create </Button>
				</svelte:fragment></Row>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header"> My Courses </h3>
		<div slot="body" class="grid">
			{#each courses as {code, name}}
				<a class="cell" href="/dashboard/course/{code}/overview"> {code} {name} </a>
			{/each}
		</div>
	</Card>

	{#each programs as {name, courses, coordinators}}
		<Card>
			<svelte:fragment slot="header">
				<h3> {name} </h3>

				<div class="flex-spacer" />

				<Tooltip data="Program Coordinators">
					<IconButton
						src={peopleIcon}
						alt="people-icon"
						callback={modals[name]?.show}
						scale={true}
					/>
				</Tooltip>

				<LinkButton href="/dashboard/program/{name}/settings"> Settings </LinkButton>

				<Modal bind:this={modals[name]}>
					<h3 slot="header"> Program Coordinators </h3>
					<p> These are the coordinators of the {name} program. You can contact them via email to request access to a course. </p>
					<ul>
						{#each coordinators as coordinator}
							<li> {coordinator} </li>
						{/each}
					</ul>
				</Modal>
			</svelte:fragment>

			<div slot="body" class="grid">
				{#each courses as code}
					<a class="cell" href="/dashboard/course/{code}/overview"> {code} {name} </a>
				{/each}
			</div>
		</Card>
	{/each}
</Layout>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.grid
		display: flex
		flex-flow: row wrap

		.cell
			flex: 0 1 100%
			padding: $grid-cell-padding

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

			@media screen and (min-width: $grid-2-column-width)
				border-bottom: 1px solid $gray
				flex-basis: 50%

			@media screen and (min-width: $grid-3-column-width)
				border-bottom: 1px solid $gray
				flex-basis: 33.3333%

</style>