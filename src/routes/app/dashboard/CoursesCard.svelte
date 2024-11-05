
<script lang="ts">

	// Internal dependencies
	import { courses } from './stores'

	// Components
	import Card from '$components/Card.svelte'

	// Exports
	export let query: string

</script>


<!-- Markup -->


<Card>
	<h3 slot="header"> My Courses </h3>

	<svelte:fragment slot="body">
		{#if !$courses.some(course => course.matchesQuery(query))}
			<span class="grayed"> There's nothing here </span>
		{:else}
			<div class="grid">
				{#each $courses as course}
					{#if course.matchesQuery(query)}
						<a class="cell" href="./course/{course.id}/overview"> {course.code} {course.name} </a>
					{/if}
				{/each}
			</div>
		{/if}
	</svelte:fragment>
</Card>


<!-- Styles -->


<style lang="sass">

	@import './style.sass'

</style>