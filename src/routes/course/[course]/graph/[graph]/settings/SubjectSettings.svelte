

<script lang="ts">

	// Internal imports
	import { Graph, Subject, Field, Relation, SubjectRelation } from '$scripts/graph/entities'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'

	// Exports
	export let graph: Graph

	// Variables
	let subjectQuery: string = ''
	let subjectIdSort: boolean | null = true
	let subjectFromSort: boolean | null = null
	let subjectToSort: boolean | null = null
	let relationQuery: string = ''
	let relationIdSort: boolean | null = true
	let relationFromSort: boolean | null = null
	let relationToSort: boolean | null = null

    $: domainOptions = graph.domains
		.filter(domain => domain.name)
		.map(domain => ({
			name: domain.name!,
			value: domain
		}))

	// Force reactivity update
	function update() {
		graph = graph // Maybe redundant Svelte 5?
	}

	// Checks if query appears in subject
	function subjectMatchesQuery(query: string, subject: Subject): boolean {
		if (!query) return true
		query = query.toLowerCase()

		let name = subject.name?.toLowerCase()
		let domain = subject.domain?.name?.toLowerCase()

		return name?.includes(query) || domain?.includes(query) || false
	}

	// Checks if query appears in relation
	function relationMatchesQuery(query: string, relation: Relation<Field>): boolean {
		if (!query) return true
		query = query.toLowerCase()

		let parent = relation.parent?.name?.toLowerCase()
		let child = relation.child?.name?.toLowerCase()

		return parent?.includes(query) || child?.includes(query) || false
	}

</script>



<!-- Markup -->



<!-- Subjects -->
<div id="subjects" class="subjects">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Subjects </h2>
		<LinkButton href="#relations"> goto relations </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={subjectQuery} />
		<Button on:click={() => { Subject.create(graph); update() }}>
			<img src={plusIcon} alt=""> New Subject
		</Button>
	</div>

	<!-- If any subjects were found that match the search -->
	{#if graph.subjects.some(subject => subjectMatchesQuery(subjectQuery, subject))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={subjectIdSort === null ? neutralSortIcon : subjectIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					subjectIdSort = !subjectIdSort
					subjectFromSort = subjectToSort = null
					graph.subjects.sort((a, b) => { return (a.id - b.id) * (subjectIdSort ? 1 : -1)})
					update()
				}}
			/>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={subjectFromSort === null ? neutralSortIcon : subjectFromSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						subjectFromSort = !subjectFromSort
						subjectIdSort = subjectToSort = null
						graph.subjects.sort((a, b) => {
							let astr = a.name || ''
							let bstr = b.name || ''
							return astr.localeCompare(bstr) * (subjectFromSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={subjectToSort === null ? neutralSortIcon : subjectToSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						subjectToSort = !subjectToSort
						subjectIdSort = subjectFromSort = null
						graph.subjects.sort((a, b) => {
							let astr = a.domain?.name || ''
							let bstr = b.domain?.name || ''
							return astr.localeCompare(bstr) * (subjectToSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no subjects were found that match the search -->
		<h6 class="grayed"> No subjects found </h6>

	{/if}

	<!-- Subject list -->
	{#each graph.subjects as subject}
		{#if subjectMatchesQuery(subjectQuery, subject)}
			<div class="row">
				<span> {subject.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { subject.delete(); update() }} />
				<Textfield label="Name" placeholder="Subject Name" bind:value={subject.name} />
				<Dropdown label="Domain" placeholder="Assigned Domain" options={domainOptions} bind:value={subject.domain} />
				<span class="preview" style:background-color={subject.color} />
			</div>
		{/if}
	{/each}
</div>

<!-- Subject relations -->
<div id="subjects" class="relations">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Relations </h2>
		<LinkButton href="#subjects"> goto subjects </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={relationQuery} />
		<Button on:click={() => { SubjectRelation.create(graph); update() }}>
			<img src={plusIcon} alt=""> New Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if graph.subjectRelations.some(relation => relationMatchesQuery(relationQuery, relation))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={relationIdSort === null ? neutralSortIcon : relationIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					relationIdSort = !relationIdSort
					relationFromSort = relationToSort = null
					graph.subjectRelations.sort((a, b) => { return (a.id - b.id) * (relationIdSort ? 1 : -1)})
					update()
				}}
			/>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={relationFromSort === null ? neutralSortIcon : relationFromSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						relationFromSort = !relationFromSort
						relationIdSort = relationToSort = null
						graph.subjectRelations.sort((a, b) => {
							let astr = a.parent?.name || ''
							let bstr = b.parent?.name || ''
							return astr.localeCompare(bstr) * (relationFromSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={relationToSort === null ? neutralSortIcon : relationToSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						relationToSort = !relationToSort
						relationIdSort = relationFromSort = null
						graph.subjectRelations.sort((a, b) => {
							let astr = a.child?.name || ''
							let bstr = b.child?.name || ''
							return astr.localeCompare(bstr) * (relationToSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no relations were found that match the search -->
		<h6 class="grayed"> No subjects found </h6>

	{/if}

	<!-- List of relations -->
	{#each graph.subjectRelations as relation}
		{#if relationMatchesQuery(relationQuery, relation)}
			<div class="row">
				<span> {relation.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
				<Dropdown label="Parent" placeholder="From Subject" options={relation.parentOptions} bind:value={relation.parent} />
				<span class="preview" style:background-color={relation.parentColor} />
				<Dropdown label="Child" placeholder="To Subject" options={relation.childOptions} bind:value={relation.child} />
				<span class="preview" style:background-color={relation.childColor} />
			</div>
		{/if}
	{/each}
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$icon-width: calc($input-icon-size + 2 * $input-icon-padding)

	.toolbar
		display: flex
		flex-flow: row nowrap
		margin-bottom: $form-big-gap
		gap: $form-small-gap

	.header
		display: flex
		flex-flow: row nowrap
		align-content: center
		justify-content: right
		width: 100%

		span
			flex: 1

	.preview
		width: $input-icon-size
		height: $input-icon-size

	.grayed
		margin: auto
		color: $gray

	.subjects, .relations
		display: flex
		flex-flow: column nowrap
		padding: $card-thick-padding
		gap: $form-small-gap

		.row
			display: grid
			place-items: center center
			gap: $form-small-gap
	
	.subjects .row
		grid-template: "id delete left right right-preview" auto / $icon-width $icon-width 1fr 1fr $icon-width

	.relations .row
		grid-template: "id delete left left-preview right right-preview" auto / $icon-width $icon-width 1fr $icon-width 1fr $icon-width

</style>
