
<script lang="ts">

	// External dependencies
	import { writable } from 'svelte/store'

	// Internal dependencies
	import {
		ProgramController,
		CourseController,
		UserController
	} from '$scripts/controllers'

	// Components
	import Card from '$components/layouts/Card.svelte'
	import Modal from '$components/layouts/Modal.svelte'
	import IconButton from '$components/buttons/IconButton.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'

	// Assets
	import peopleIcon from '$assets/people-icon.svg'
	import { onMount } from 'svelte';

	// Exports
	export let program: ProgramController
	export let query: string

	// Variables
	let coordinator_modal: Modal
	let admins = writable<UserController[] | undefined>(undefined)
	let courses = writable<CourseController[] | undefined>(undefined)

	onMount(async () => {
		// admins.set(await program.getAdmins()) // TODO: Implement this
		courses.set(await program.getCourses())

		courses.subscribe(courses => console.log(courses))
	})

</script>


<!-- Markup -->


<Card>
	<svelte:fragment slot="header">
		<h3> {program.name} </h3>

		<div class="flex-spacer" />

		<IconButton
			src={peopleIcon}
			description="Program Coordinators"
			on:click={coordinator_modal?.show}
			scale
		/>

		<LinkButton href="./program/{program.id}/settings"> Program settings </LinkButton>

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
	</svelte:fragment>

	<svelte:fragment slot="body">
		{#if $courses === undefined}
			<span class="grayed"> Loading... </span>
		{:else if !$courses.some(course => course.matchesQuery(query))}
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