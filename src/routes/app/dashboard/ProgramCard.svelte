
<script lang="ts">

	// External dependencies
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	// Internal dependencies
	import { search_query } from './stores'

	import type {
		ProgramController,
		CourseController,
		UserController
	} from '$scripts/controllers'

	// Components
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'

	// Assets
	import people_icon from '$assets/people-icon.svg'

	// Exports
	export let program: ProgramController

	// Modals
	let coordinator_modal: Modal

	// Stores
	let courses = writable<CourseController[] | undefined>(undefined)
	let admins = writable<UserController[] | undefined>(undefined)

	onMount(async () => {
		courses.set(await program.getCourses())
		// admins.set(await program.getAdmins()) // TODO: Implement this
	})

</script>


<!-- Markup -->


<Card>
	<svelte:fragment slot="header">
		<h3> {program.name} </h3>

		<div class="flex-spacer" />

		<IconButton
			src={people_icon}
			description="Program Coordinators"
			on:click={coordinator_modal?.show}
			scale
		/>

		<LinkButton href="./program/{program.id}/settings"> Program settings </LinkButton>
	</svelte:fragment>

	<svelte:fragment slot="body">
		{#if $courses === undefined}
			<span class="grayed"> Loading... </span>
		{:else if !$courses.some(course => course.matchesQuery($search_query))}
			<span class="grayed"> There's nothing here </span>
		{:else}
			<div class="grid">
				{#each $courses as course}
					{#if course.matchesQuery($search_query)}
						<a class="cell" href="./course/{course.id}/overview"> {course.code} {course.name} </a>
					{/if}
				{/each}
			</div>
		{/if}
	</svelte:fragment>
</Card>

<Modal bind:this={coordinator_modal}>
	<h3 slot="header"> Program Coordinators </h3>
	<p> These are the coordinators of the {program.name} program. You can contact them via email to request access to a course. </p>

	{#if $admins === undefined}
		<p class="grayed"> Loading... </p>
	{:else if $admins.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<ul>
			{#each $admins as admin}
				<li> {admin.first_name} {admin.last_name} </li>
			{/each}
		</ul>
	{/if}
</Modal>


<!-- Styles -->


<style lang="sass">

	@import './style.sass'

</style>