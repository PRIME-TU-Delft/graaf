
<script lang="ts">

	// Internal imports
	import { AssignedUser } from '$scripts/entities'
	import { course } from '$stores'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Searchbar from '$components/Search.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	// Functions
	function userMatchesQuery(query: string, user: AssignedUser) {
		/* Returns whether the user matches the query */

		if (!query) return true
		query = query.toLowerCase()

		let name = user.name.toLowerCase()
		let permissions = user.permissions?.toString().toLowerCase() || ''

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

	// Variables
	let query: string = ''
	let name_sort: boolean | undefined
	let permission_sort: boolean | undefined

</script>


<!-- Markup -->


<div id="domains" class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Assigned Users </h2>

		<div class="flex-spacer" />

		<Searchbar bind:value={query} />
		<Button on:click={() => { AssignedUser.create(course); update() }}> Add User </Button>
	</div>

	{#if course.users.some(user => userMatchesQuery(query, user))}

		<!-- Header -->
		<div class=row>

			<!-- Name label and sort button -->
			<div class="header" style="grid-area: name;">
				<span> Name </span>
				<IconButton
					src={icon(name_sort)}
					on:click={() => {
						permission_sort = undefined
						name_sort = !name_sort
						alphabetize(course.users, user => user.name, name_sort)
						update()
					}}
				/>
			</div>

			<!-- Permissions label and sort button -->
			<div class="header" style="grid-area: permissions;">
				<span> Permissions </span>
				<IconButton
					src={icon(permission_sort)}
					on:click={() => {
						name_sort = undefined
						permission_sort = !permission_sort
						alphabetize(course.users, assigned => assigned.permissions?.toString() || '', permission_sort)
						update()
					}}
				/>
			</div>
		</div>

		<!-- Domain list -->
		{#each course.users as user}
			{#if userMatchesQuery(query, user)}
				<div class="row" id={`user-${user.id}`}>
					<Validation short data={user.validate()} />
					{user.index + 1}
					<IconButton scale src={trashIcon} on:click={() => { user.delete(); update() }} />
					<Textfield label="Name" bind:value={user.name} on:input={update}/>
					<Dropdown label="Permissions" placeholder="Permission" options={course.permission_options} bind:value={user.permissions} on:input={update}/>
				</div>
			{/if}
		{/each}

	{:else}

		<!-- If no relations were found that match the search -->
		<h6 class="grayed"> No relations found </h6>

	{/if}

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

		.grayed
			margin: auto
			color: $gray

		.toolbar
			display: flex
			margin-bottom: $form-big-gap
			gap: $form-small-gap

		.row
			display: grid
			grid-template: "validation id delete name permissions" auto / $icon-width $icon-width $icon-width 1fr 1fr
			place-items: center center
			gap: $form-small-gap

			padding-right: calc($icon-width + $form-small-gap)

			span
				width: 100%

			.header
				display: flex
				flex-flow: row nowrap
				align-content: center
				justify-content: right
				width: 100%

</style>
