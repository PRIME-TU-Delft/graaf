
<script lang="ts">

	// Internal imports
	import { Course, AssignedUser } from '$scripts/entities'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte';
	import Modal from '$components/Modal.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let course: Course
	export let update: () => void

	// Variables
	let query: string = ''
	let nameSort: boolean | undefined
	let permissionSort: boolean | undefined
	let addUserModal: Modal

	// Functions
	function userMatchesQuery(query: string, user: AssignedUser) {
		/* Returns whether the user matches the query */

		if (!query) return true
		query = query.toLowerCase()

		let name = user.name.toLowerCase()
		let permissions = user.permissions.toString().toLowerCase()

		return name.includes(query) || permissions.includes(query)
	}

	function alphabetize<T>(list: T[], key: (item: T) => string, ascending: boolean = true) {
		/* Alphabetizes list */

		list.sort((a, b) => key(a).localeCompare(key(b)))
		if (!ascending) list.reverse()
	}

	function icon(state?: boolean): string {
		/* Returns the sort icon based on the state */

		return state === undefined ? neutralSortIcon : state ? ascendingSortIcon : descedingSortIcon
	}

</script>


<!-- Markup -->


<div id="domains" class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Assigned Users </h2>

		<div class="flex-spacer" />

		<Searchbar bind:value={query} />
		<Button on:click={addUserModal?.show}> Add User </Button>
		<Modal bind:this={addUserModal}>
			<h3 slot="header"> Add User </h3>
			Assigning a user to this course. Read permissions allow the user to view the course and its graphs. With write permissions users can edit graphs. Admins can edit the course settings.

			<form>
				<label for="name"> Name </label>
				<Textfield label="Name" />
				<label for="permissions"> Permissions </label>
				<Dropdown label="Permissions" placeholder="Permission" options={course.permission_options} />
				<Button submit> Add </Button>
			</form>
		</Modal>
	</div>

	<!-- Header -->
	<div class=row>

		<!-- Name label and sort button -->
		<div class="header" style="grid-area: name;">
			<span> Name </span>
			<IconButton
				src={icon(nameSort)}
				on:click={() => {
					permissionSort = undefined
					nameSort = !nameSort
					alphabetize(course.users, assigned => assigned.name, nameSort)
					update()
				}}
			/>
		</div>

		<!-- Permissions label and sort button -->
		<div class="header" style="grid-area: permissions;">
			<span> Permissions </span>
			<IconButton
				src={icon(permissionSort)}
				on:click={() => {
					nameSort = undefined
					permissionSort = !permissionSort
					alphabetize(course.users, assigned => assigned.permissions.toString(), permissionSort)
					update()
				}}
			/>
		</div>
	</div>

	<!-- Domain list -->
	{#each course.users as user, n}
		{#if userMatchesQuery(query, user)}
			<div class="row">
				{n + 1}
				<IconButton scale src={trashIcon} on:click={() => { user.delete(); update() }} />
				<span> {user.name} </span>
				<Dropdown label="Permissions" placeholder="Permission" options={course.permission_options} bind:value={user.permissions} on:input={update}/>
			</div>
		{/if}
	{/each}
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$icon-width: calc($input-icon-size + 2 * $input-icon-padding)

	.editor
		display: flex
		flex-flow: column nowrap
		padding: $card-thick-padding
		gap: $form-small-gap

		.toolbar
			display: flex
			margin-bottom: $form-big-gap
			gap: $form-small-gap

		.row
			display: grid
			grid-template: "id delete name permissions" auto / $icon-width $icon-width 1fr 1fr
			place-items: center center
			gap: $form-small-gap

			span
				width: 100%

			.header
				display: flex
				flex-flow: row nowrap
				align-content: center
				justify-content: right
				width: 100%
		
		form
			display: grid
			grid-template: "label content" auto / 1fr 2fr
			gap: $form-small-gap $form-medium-gap
			place-items: center start

			margin-top: $form-big-gap

			label
				grid-column: label
				justify-self: end

			:global(.textfield), :global(.dropdown)
				grid-column: content

			:global(.button)
				grid-column: content

</style>
