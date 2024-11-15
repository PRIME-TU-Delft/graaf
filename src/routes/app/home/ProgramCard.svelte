
<script lang="ts">

	// Internal dependencies
	import type { ProgramController } from '$scripts/controllers'

	// Components
	import Grid from './Grid.svelte'
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'

	// Assets
	import people_icon from '$assets/people-icon.svg'

	// Exports
	export let program: ProgramController
	export let query: string

	$: filtered_courses = program.courses.filter(course => course.matchesQuery(query))

	// Modals
	let coordinator_modal: Modal

</script>


<!-- Markup -->


<Modal bind:this={coordinator_modal}>
	<h3 slot="header"> Program Admins </h3>
	<p> These are the admins of the {program.name} program. You can contact them via email to request access to a course. </p>

	{#if program.admins.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<ul>
			{#each program.admins as admin}
				<li> {admin.first_name} {admin.last_name} <span class="email"> {admin.email} </span></li>
			{/each}
		</ul>
	{/if}
</Modal>

<Card>
	<svelte:fragment slot="header">
		<h3> {program.name} </h3>

		<div class="flex-spacer" />

		<IconButton
			src={people_icon}
			description="Program Admins"
			on:click={coordinator_modal?.show}
			scale
		/>

		<LinkButton href="./program/{program.id}/settings"> Program settings </LinkButton>
	</svelte:fragment>

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