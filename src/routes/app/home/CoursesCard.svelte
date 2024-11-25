
<script lang="ts">

	// Internal dependencies
	import { courses, query } from './stores'

	// Components
	import Grid from './Grid.svelte'

	import Card from '$components/Card.svelte'

	// Main
	$: filtered_courses = $courses.filter(course => course.matchesQuery($query))

</script>

<!-- Markup -->

<Card>
	<h3 slot="header"> My Courses </h3>

	{#if filtered_courses.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<Grid>
			{#each filtered_courses as course}
				<a href="./course/{course.id}/overview"> {course.code} {course.name} </a>
			{/each}
		</Grid>
	{/if}
</Card>