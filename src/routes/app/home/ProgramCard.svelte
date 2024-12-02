
<script lang="ts">

	// Internal dependencies
	import { query } from './stores'
	
	import type { ProgramController } from '$scripts/controllers'

	// Components
	import Grid from './Grid.svelte'

	import SimpleModal from '$components/SimpleModal.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import people_icon from '$assets/people-icon.svg'

	// Main
	export let program: ProgramController

	let member_modal: SimpleModal

	$: filtered_courses = program.courses.filter(course => course.matchesQuery($query))

</script>

<!-- Markup -->

<SimpleModal bind:this={member_modal}>
	<h3 slot="header"> Program Admins </h3>
	These are the admins of this program. You can contact them via email to request access to a course.

	<svelte:fragment slot="footer">
		{#if program.admins.length === 0}
			<p class="grayed"> There's nothing here </p>
		{:else}
			<ul>
				{#each program.admins as admin}
					<li> {admin.first_name} {admin.last_name} <span class="email"> {admin.email} </span></li>
				{/each}
			</ul>
		{/if}
	</svelte:fragment>
</SimpleModal>

<Card>
	<svelte:fragment slot="header">
		<h3> {program.name} </h3>

		<div class="flex-spacer" />

		<IconButton
			src={people_icon}
			description="Program Admins"
			on:click={member_modal.show}
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