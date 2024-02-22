
<!-- Script -->

<script lang="ts">

	import Card from '$components/Card.svelte';

	// TODO This is a temporary dataclass to simulate the data that would be fetched from the server
	class CourseData {
		code: string;
		name: string;

		constructor(code: string, name: string) {
			this.code = code;
			this.name = name;
		}
	}

	// TODO This is a temporary array to simulate the data that would be fetched from the server
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

</script>

<!-- Markup -->

<Card>
	<div slot="header" class="header">
		<h1>My Courses</h1>
		<a class="link-blue" href="/">New Course</a>
	</div>
	<div slot="body" class="grid">
		{#each courses as {code, name}}
			<a class="cell" href="/">{code} {name}</a>
		{/each}
	</div>
</Card>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.header
		display: flex
		flex-flow: row nowrap
		justify-content: right

		h1
			margin-right: auto
			font-size: 1.5rem
			font-weight: inherit

	.grid
		display: flex
		flex-flow: row wrap

	.cell
		flex: 1 1 100%
		padding: 0.5rem
		border-bottom: 1px solid variables.$gray

		color: variables.$secondary
		transition: all 0.15s ease-in-out

		&:hover
			color: variables.$primary
			text-decoration: underline

	@media screen and (min-width: 700px)
		.cell
			flex: 1 1 50%

	@media screen and (min-width: 1100px)
		.cell
			flex: 1 1 33.3333%

</style>