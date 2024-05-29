

<script lang="ts">

	// Internal imports
	import { Graph, Subject, Field, Relation } from '$scripts/graph/entities'

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
	let subjectNameSort: boolean | undefined
	let subjectDomainSort: boolean | undefined
	let relationQuery: string = ''
	let relationFromSort: boolean | undefined
	let relationToSort: boolean | undefined

	let relations: Relation[] = graph.subjectRelations

    $: domainOptions = graph.domains
		.filter(domain => domain.name)
		.map(domain => (
			{ name: domain.name!, value: domain, available: true }
		))

	// Force reactivity update
	// NOTE: Maybe redundant Svelte 5?
	function update() {
		graph = graph
		relations = relations
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
	function relationMatchesQuery(query: string, relation: Relation): boolean {
		if (!query) return true
		query = query.toLowerCase()

		let parent = relation.parent?.name?.toLowerCase()
		let child = relation.child?.name?.toLowerCase()

		return parent?.includes(query) || child?.includes(query) || false
	}

	// Alphabetizes strings
	function alphabetize(a?: string, b?: string, ascending: boolean = true): number {
		return (a ?? '').localeCompare(b ?? '') * (ascending ? 1 : -1)
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

			<!-- Name label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> Name </span>
				<IconButton
					src={subjectNameSort === undefined ? neutralSortIcon : subjectNameSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						subjectDomainSort = undefined
						subjectNameSort = !subjectNameSort
						graph.subjects.sort((a, b) => alphabetize(a.name, b.name, subjectNameSort))
						update()
					}}
				/>
			</div>

			<!-- Domain label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> Domain </span>
				<IconButton
					src={subjectDomainSort === undefined ? neutralSortIcon : subjectDomainSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						subjectNameSort = undefined
						subjectDomainSort = !subjectDomainSort
						graph.subjects.sort((a, b) => alphabetize(a.domain?.name, b.domain?.name, subjectDomainSort))
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
	{#each graph.subjects as subject, n}
		{#if subjectMatchesQuery(subjectQuery, subject)}
			<div class="row">
				<span> {n + 1} </span>
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
		<Button on:click={() => { relations.push(Relation.create(graph)); update() }}>
			<img src={plusIcon} alt=""> New Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if relations.some(relation => relationMatchesQuery(relationQuery, relation))}

		<!-- Header -->
		<div class=row>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={relationFromSort === undefined ? neutralSortIcon : relationFromSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						relationToSort = undefined
						relationFromSort = !relationFromSort
						relations.sort((a, b) => alphabetize(a.parent?.name, b.parent?.name, relationFromSort))
						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={relationToSort === undefined ? neutralSortIcon : relationToSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						relationFromSort = undefined
						relationToSort = !relationToSort
						relations.sort((a, b) => alphabetize(a.child?.name, b.child?.name, relationToSort))
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
	{#each relations as relation, n}
		{#if relationMatchesQuery(relationQuery, relation)}
			<div class="row">
				<span> {n + 1} </span>
				<IconButton scale src={trashIcon} on:click={() => {
					relations = relations.filter(r => r !== relation)
					relation.delete()
					update()
				}} />

				<Dropdown label="Parent" placeholder="From Subject" options={relation.filterParentOptions(graph.subjects)} bind:value={relation.parent} />
				<span class="preview" style:background-color={relation.parentColor} />
				<Dropdown label="Child" placeholder="To Subject" options={relation.filterChildOptions(graph.subjects)} bind:value={relation.child} />
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
