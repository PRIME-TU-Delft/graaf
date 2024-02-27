
<!-- Script -->

<script lang="ts">

	import Card from '$components/Card.svelte';
	import people_icon from '$assets/people-icon.svg';
	import Searchbar from '$components/Searchbar.svelte';


	function onSearch(event: Event) {
		// TODO add onSearch event
	}


	// TODO These classesa are temporary. Idk what the API will serve
	class ProgramData {
		name: string;
		courses: string[];

		constructor(name: string, courses: string[]) {
			this.name = name;
			this.courses = courses;
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
		new ProgramData("Computer Science", ["CSE1200", "CSE1205", "CSE1210"]),
		new ProgramData("Electrical Engineering", ["EE1M11", "EE1M21"]),
		new ProgramData("Mathematics", ["AESB1311", "CSE1200", "CSE1205", "CSE1210", "CTB2105", "CTB2200", "EE1M11", "EE1M21", "LB1155", "NB2191", "TB131B", "TB132B", "TN1401WI", "WBMT", "WBMT1050", "WI1402LR", "WI1403LR", "WI1421LR", "WI2031TH"])
	]

</script>

<!-- Markup -->

<div class="dashboard">
	<div class="toolbar">
		<div class="searchbar"><Searchbar onChange={onSearch} placeholder="Search courses" /></div>
	</div>
	
	<Card>
		<div slot="header" class="card-header">
			<h1>My Courses</h1>
			<a href="/">New Course</a> <!-- TODO real href -->
		</div>
		<div slot="body" class="grid">
			{#each courses as {code, name}}
				<a class="cell" href="/">{code} {name}</a>
			{/each}
		</div>
	</Card>
	
	{#each programs as {name, courses}}
		<Card>
			<div slot="header" class="card-header">
				<h1>{name}</h1>
				<img src={people_icon} alt="contributors">
				<a href="/">Settings</a> <!-- TODO real href -->
			</div>
			<div slot="body" class="grid">
				{#each courses as code}
					<a class="cell" href="/">{code} {getCourse(code)?.name}</a> <!-- TODO real href -->
				{/each}
			</div>
		</Card>
	{/each}
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.dashboard
		display: flex
		flex-flow: column nowrap
		align-items: center
		gap: 1rem

	.toolbar
		display: flex
		flex-flow: row nowrap
		align-items: center

		width: 100%

		.searchbar
			width: 300px
			margin-left: auto

	.card-header
		display: flex
		flex-flow: row nowrap
		justify-content: right
		align-items: center
		gap: 5px

		width: fill-available

		h1
			margin-right: auto
			font-size: 1.5rem

		img
			height: 1.5rem
			padding: 0.25rem

			transition: all 0.15s ease-in-out

			// NOTE filters icon color to purple
			filter: brightness(0) saturate(100%) invert(43%) sepia(21%) saturate(473%) hue-rotate(194deg) brightness(93%) contrast(85%)

			&:hover
				cursor: pointer
				transform: scale(1.1)

				// NOTE filters icon color to dark-purple
				filter: brightness(0) saturate(100%) invert(34%) sepia(9%) saturate(1144%) hue-rotate(196deg) brightness(99%) contrast(84%)

		a
			padding: 0.25rem

			color: variables.$purple
			transition: all 0.15s ease-in-out

			&:hover
				cursor: pointer
				text-decoration: underline
				color: variables.$dark-purple

	.grid
		display: flex
		flex-flow: row wrap

		.cell
			flex: 0 1 100%
			padding: 0.5rem
			border-bottom: 1px solid variables.$gray

			color: variables.$dark-gray
			transition: all 0.15s ease-in-out

			&:hover
				cursor: pointer
				color: variables.$black
				text-decoration: underline

			&:last-child
				flex-grow: 1

			@media screen and (min-width: 700px)
				flex-basis: 50%

			@media screen and (min-width: 1100px)
				flex-basis: 33.3333%

</style>