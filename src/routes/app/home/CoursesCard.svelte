<script lang="ts">
	// Internal dependencies
	import { courses, query } from './stores';

	// Components
	import Grid from './Grid.svelte';

	import Card from '$components/Card.svelte';

	// Main
	let filtered_courses = $derived($courses.filter((course) => course.matchesQuery($query)));
</script>

<!-- Markup -->

<Card>
	{#snippet header()}
		<h3>My Courses</h3>
	{/snippet}

	{#if filtered_courses.length === 0}
		<p class="grayed">There's nothing here</p>
	{:else}
		<Grid>
			{#each filtered_courses as course}
				<a href="./course/{course.id}/overview"> {course.display_name} </a>
			{/each}
		</Grid>
	{/if}
</Card>
