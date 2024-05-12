
<script lang="ts">

	// Lib imports
	import { Graph, Field, Relation, DomainRelation, SubjectRelation } from '$scripts/entities'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Searchbar.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'

	// Exports
	export let graph: Graph

	// Variables
	let domainQuery: string = ''
	let subjectQuery: string = ''
	let domainIdSort: boolean | null = true
	let domainFromSort: boolean | null = null
	let domainToSort: boolean | null = null
	let subjectIdSort: boolean | null = true
	let subjectFromSort: boolean | null = null
	let subjectToSort: boolean | null = null

	// Force reactivity update
	function update() {
		graph = graph // Maybe redundant Svelte 5?
	}

	// Checks if query appears in relation
	function search(query: string, relation: Relation<Field>): boolean {
		query = query.toLowerCase()
		let parent = relation.parent?.name?.toLowerCase()
		let child = relation.child?.name?.toLowerCase()
		return parent?.includes(query) || child?.includes(query) || false
	}

</script>



<!-- Markup -->



<!-- Domain relations -->
<div id="domains" class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2>Domain relations</h2>
		<LinkButton href="#subjects">goto subjects</LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={domainQuery} />
		<Button on:click={() => { DomainRelation.create(graph); update() }}>
			<img src={plusIcon} alt=""> Add Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if graph.domainRelations.some(relation => search(domainQuery, relation))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={domainIdSort === null ? neutralSortIcon : domainIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					domainIdSort = !domainIdSort
					domainFromSort = domainToSort = null
					graph.domainRelations.sort((a, b) => (a.id - b.id) * (domainIdSort ? 1 : -1))
					update()
				}}
			/>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={domainFromSort === null ? neutralSortIcon : domainFromSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						domainFromSort = !domainFromSort
						domainIdSort = domainToSort = null
						graph.domainRelations.sort((a, b) => {
							let astr = a.parent?.name || ''
							let bstr = b.parent?.name || ''
							return astr.localeCompare(bstr) * (domainFromSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={domainToSort === null ? neutralSortIcon : domainToSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						domainToSort = !domainToSort
						domainIdSort = domainFromSort = null
						graph.domainRelations.sort((a, b) => {
							let astr = a.child?.name || ''
							let bstr = b.child?.name || ''
							return astr.localeCompare(bstr) * (domainToSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no relations were found that match the search -->
		<h6 class="empty"> No relations found </h6>

	{/if}

	<!-- List of relations -->
	{#each graph.domainRelations as relation}
		{#if search(domainQuery, relation)}
			<div class="row">
				<span class="id"> {relation.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
				<Dropdown label="Parent" placeholder="From Domain" options={relation.parentOptions()} bind:value={relation.parent} />
				<span class="preview" style:background-color={relation.parentColor()} />
				<Dropdown label="Child" placeholder="To Domain" options={relation.childOptions()} bind:value={relation.child} />
				<span class="preview" style:background-color={relation.childColor()} />
			</div>
		{/if}
	{/each}
</div>

<!-- Subject relations -->
<div id="subjects" class="editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2>Subject relations</h2>
		<LinkButton href="#domains">goto domains</LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={subjectQuery} />
		<Button on:click={() => { SubjectRelation.create(graph); update() }}>
			<img src={plusIcon} alt=""> Add Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if graph.subjectRelations.some(relation => search(subjectQuery, relation))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={subjectIdSort === null ? neutralSortIcon : subjectIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					subjectIdSort = !subjectIdSort
					subjectFromSort = subjectToSort = null
					graph.subjectRelations.sort((a, b) => { return (a.id - b.id) * (subjectIdSort ? 1 : -1)})
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
						graph.subjectRelations.sort((a, b) => {
							let astr = a.parent?.name || ''
							let bstr = b.parent?.name || ''
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
						graph.subjectRelations.sort((a, b) => {
							let astr = a.child?.name || ''
							let bstr = b.child?.name || ''
							return astr.localeCompare(bstr) * (subjectToSort ? 1 : -1)
						})

						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no relations were found that match the search -->
		<h6 class="empty"> No subjects found </h6>

	{/if}

	<!-- List of relations -->
	{#each graph.subjectRelations as relation}
		{#if search(subjectQuery, relation)}
			<div class="row">
				<span class="id"> {relation.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
				<Dropdown label="Parent" placeholder="From Subject" options={relation.parentOptions()} bind:value={relation.parent} />
				<span class="preview" style:background-color={relation.parentColor()} />
				<Dropdown label="Child" placeholder="To Subject" options={relation.childOptions()} bind:value={relation.child} />
				<span class="preview" style:background-color={relation.childColor()} />
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
			flex-flow: row nowrap
			margin-bottom: $form-big-gap
			gap: $form-small-gap

		.empty
			margin: auto
			color: $gray

		.row
			display: grid
			grid-template: "id delete left left-preview right right-preview" auto / $icon-width $icon-width 1fr $icon-width 1fr $icon-width
			place-items: center center
			gap: $form-small-gap
			width: 100%

			.header
				display: flex
				flex-flow: row nowrap
				align-content: center
				justify-content: right
				width: 100%

				span
					flex: 1

			:global(.icon-button)
				margin-bottom: 5px

			.preview
				width: $input-icon-size
				height: $input-icon-size

</style>
