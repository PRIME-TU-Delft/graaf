

<script lang="ts">

	// Internal imports
	import { Graph, Subject, Relation, SubjectRelation } from '$scripts/entities'

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
	export let update: () => void

	// Variables
	let subjectQuery: string = ''
	let subjectNameSort: boolean | undefined
	let subjectDomainSort: boolean | undefined
	let relationQuery: string = ''
	let relationFromSort: boolean | undefined
	let relationToSort: boolean | undefined

	// Functions
	function subjectMatchesQuery(query: string, subject: Subject): boolean {
		/* Checks if query appears in subject */

		if (!query) return true
		query = query.toLowerCase()

		let name = subject.name?.toLowerCase()
		let domain = subject.domain?.name?.toLowerCase()

		return name?.includes(query) || domain?.includes(query) || false
	}

	function relationMatchesQuery(query: string, relation: SubjectRelation): boolean {
		/* Checks if query appears in relation */

		if (!query) return true
		query = query.toLowerCase()

		let parent = relation.parent?.name?.toLowerCase()
		let child = relation.child?.name?.toLowerCase()

		return parent?.includes(query) || child?.includes(query) || false
	}

	function alphabetize<T>(list: T[], key: (item: T) => string, ascending: boolean = true) {
		/* Alphabetizes list */

		list.sort((a, b) => key(a).localeCompare(key(b)))
		if (!ascending) list.reverse()
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
						alphabetize(graph.subjects, subject => subject.name, subjectNameSort)
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
						alphabetize(graph.subjects, subject => subject.domain?.name || '', subjectDomainSort)
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
				<span> {subject.index + 1} </span>
				<IconButton scale src={trashIcon} on:click={() => { subject.delete(); update() }} />
				<Textfield label="Name" placeholder="Subject Name" bind:value={subject.name} on:input={update} />
				<Dropdown label="Domain" placeholder="Assigned Domain" options={subject.domain_options} bind:value={subject.domain} on:change={update} />
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
	{#if graph.subject_relations.some(relation => relationMatchesQuery(relationQuery, relation))}

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
						alphabetize(graph.subject_relations, relation => relation.parent?.name || '', relationFromSort)
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
						alphabetize(graph.subject_relations, relation => relation.child?.name || '', relationToSort)
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
	{#each graph.subject_relations as relation}
		{#if relationMatchesQuery(relationQuery, relation)}
			<div class="row">
				<span> {relation.index + 1} </span>
				<IconButton scale src={trashIcon} on:click={() => {
					relation.delete()
					update()
				}} />

				<Dropdown label="Parent" placeholder="From Subject" options={relation.parent_options} bind:value={relation.parent} on:change={update} />
				<span class="preview" style:background-color={relation.parent_color} />
				<Dropdown label="Child" placeholder="To Subject" options={relation.child_options} bind:value={relation.child} on:change={update} />
				<span class="preview" style:background-color={relation.child_color} />
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
