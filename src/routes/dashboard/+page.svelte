
<!-- Script -->

<script lang="ts">

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
	let createCourseModal: Modal;
	let createProgramModal: Modal;

	// TODO EVERYTHING BELOW THIS LINE IS TEMPORARY

	class ProgramData {
		name: string;
		courses: string[];
		coordinators: string[];

		constructor(name: string, courses: string[], coordinators: string[]) {
			this.name = name;
			this.courses = courses;
			this.coordinators = coordinators;
		}
	}

	class CourseData {
		code: string;
		name: string;

		constructor(code: string, name: string) {
			this.code = code;
			this.name = name;
		}
	}

	function getCourse (code: string) {
		for (let course of courses) {
			if (course.code === code) {
				return course;
			}
		}
	}

	let courses = [
		new CourseData("AESB1311", "Linear Algebra"),
		new CourseData("CSE1200",  "Calculus"),
		new CourseData("CSE1205",  "Linear Algebra"),
		new CourseData("CSE1210",  "Cluster Probability & Statistics"),
		new CourseData("CTB2105",  "Differentiaalvergelijkingen"),
		new CourseData("CTB2200",  "Kansrekening en Statistiek"),
		new CourseData("EE1M11",   "Linear Algebra and Analysis A"),
		new CourseData("EE1M21",   "Linear Algebra and Analysis B"),
		new CourseData("LB1155",   "Calculus"),
		new CourseData("NB2191",   "Differential Equations"),
		new CourseData("TB131B",   "Differentiaalvergelijkingen en Lineare Algebra"),
		new CourseData("TB132B",   "Multivariabele Calculus en Lineaire Algebra"),
		new CourseData("TN1401WI", "Analyse voor TNW 1"),
		new CourseData("WBMT",     "Linear Algebra"),
		new CourseData("WBMT1050", "Calculus for Engineering"),
		new CourseData("WI1402LR", "Calculus II"),
		new CourseData("WI1403LR", "Linear Algebra"),
		new CourseData("WI1421LR", "Calculus I"),
		new CourseData("WI2031TH", "Probability and Statistics")
	]

	let programs = [
		new ProgramData("Computer Science", ["CSE1200", "CSE1205", "CSE1210"], ["Beryl van Gelderen"]),
		new ProgramData("Electrical Engineering", ["EE1M11", "EE1M21"], ["Eva Lnguis", "Merel Piekaar"]),
		new ProgramData("Mathematics", ["AESB1311", "CSE1200", "CSE1205", "CSE1210", "CTB2105", "CTB2200", "EE1M11", "EE1M21", "LB1155", "NB2191", "TB131B", "TB132B", "TN1401WI", "WBMT", "WBMT1050", "WI1402LR", "WI1403LR", "WI1421LR", "WI2031TH"], ["Beryl van Gelderen", "Eva Lnguis", "Merel Piekaar"])
	]

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

		<Button callback={createCourseModal?.show}>
			<img src={plusIcon} alt="Plus icon"> New Course
		</Button>

		<Button callback={createProgramModal?.show}>
			<img src={plusIcon} alt="Plus icon"> New Program
		</Button>

		<div class="flex-spacer" />

		<Searchbar onChange={onSearch} placeholder="Search courses" />
		
		<Modal bind:this={createCourseModal}>
			<h3 slot="header"> Create Course </h3>

			<form>
				<Textfield label="Code"/>
				<Textfield label="Title"/>
				<Row><svelte:fragment slot="right">
					<Button callback={newCourse}> Create </Button>
				</svelte:fragment></Row>
			</form>
		</Modal>

		<Modal bind:this={createProgramModal}>
			<h3 slot="header"> Create Program </h3>

			<form>
				<Textfield label="Title"/>
				<Row><svelte:fragment slot="right">
					<Button callback={newProgram}> Create </Button>
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
					<a class="cell" href="/dashboard/course/{code}/overview"> {code} {getCourse(code)?.name} </a>
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