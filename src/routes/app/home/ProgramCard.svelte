<script lang="ts">
	// Internal dependencies
	import { query } from './stores';

	import type { ProgramController } from '$scripts/controllers';

	// Components
	import Grid from './Grid.svelte';

	import SimpleModal from '$components/SimpleModal.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import IconButton from '$components/IconButton.svelte';
	import Card from '$components/Card.svelte';

	// Assets
	import people_icon from '$assets/people-icon.svg';

	interface Props {
		// Main
		program: ProgramController;
	}

	let { program }: Props = $props();

	let member_modal = $state<SimpleModal>();

	let filtered_courses = $derived(program.courses.filter((course) => course.matchesQuery($query)));
</script>

<!-- Markup -->

<SimpleModal bind:this={member_modal}>
	{#snippet header()}
		<h3>Program Admins</h3>
	{/snippet}
	These are the admins of this program. You can contact them via email to request access to a course.

	{#snippet footer()}
		{#if program.admins.length === 0}
			<p class="grayed">There's nothing here</p>
		{:else}
			<ul>
				{#each program.admins as admin}
					<li>{admin.first_name} {admin.last_name} <span class="email"> {admin.email} </span></li>
				{/each}
			</ul>
		{/if}
	{/snippet}
</SimpleModal>

<Card>
	{#snippet header()}
		<h3>{program.display_name}</h3>

		<div class="flex-spacer"></div>

		<IconButton src={people_icon} description="Program Admins" onclick={member_modal?.show} scale />

		<LinkButton href="./program/{program.id}/settings">Program settings</LinkButton>
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
