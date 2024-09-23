

<script lang="ts">

	// Internal imports
	import { Subject, SubjectRelation, SortOption } from '$scripts/entities'
	import { graph } from '$stores'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Search.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'

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

	function sortIcon(state?: boolean): string {
		/* Returns the sort icon based on its state */

		return state === undefined ? neutralSortIcon : state ? ascendingSortIcon : descedingSortIcon
	}

	function update() {
		/* Force store update
		 * Svelte is a lil dum dum, so subscribers are only notified if the store is reassigned.
		 * This happens either explicitly (like here), or in bind:value={store} bindings.
		 * So, if you want graph changes to reflect in the ui, you need to do either.
		 * It is rumored this will be better in Svelte 5, so im leaving this todo here.
		 */

		// TODO remove this function when Svelte 5 is released

		$graph = $graph
	}

	// Variables
	let subject_query: string = ''
	let subject_name_sort: boolean | undefined
	let subject_domain_sort: boolean | undefined

	let relation_query: string = ''
	let relation_parent_sort: boolean | undefined
	let relation_child_sort: boolean | undefined

</script>


<!-- Markup -->


<!-- Subjects -->
<div id="subjects" class="subjects editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Subjects </h2>
		<LinkButton href="#relations"> go to relations </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={subject_query} />
		<Button on:click={async () => { await Subject.create($graph); update() }}>
			<img src={plusIcon} alt=""> New Subject
		</Button>
	</div>

	<!-- If any subjects were found that match the search -->
	{#if $graph.subjects.some(subject => subjectMatchesQuery(subject_query, subject))}

		<!-- Header -->
		<div class=row>

			<!-- Name label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> Name </span>
				<IconButton
					src={sortIcon(subject_name_sort)}
					on:click={() => {
						subject_domain_sort = undefined
						subject_name_sort = !subject_name_sort
						$graph.sort(SortOption.subjects | SortOption.name, subject_name_sort)
						update()
					}}
				/>
			</div>

			<!-- Domain label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> Domain </span>
				<IconButton
					src={sortIcon(subject_domain_sort)}
					on:click={() => {
						subject_name_sort = undefined
						subject_domain_sort = !subject_domain_sort
						$graph.sort(SortOption.subjects | SortOption.domain, subject_domain_sort)
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
	{#each $graph.subjects as subject}
		{#if subjectMatchesQuery(subject_query, subject)}
			<div class="row" id={subject.anchor}>
				<Validation short data={subject.validate()} />
				<span> {subject.index + 1} </span>
				<IconButton scale
					src={trashIcon}
					on:click={async () => {
						await subject.delete()
						update()
					}}
					/>

				<Textfield
					label="Name"
					placeholder="Subject Name"
					bind:value={subject.name}
					on:change={async () => await subject.save('name')}
					/>

				<Dropdown
					label="Domain"
					placeholder="Assigned Domain"
					options={subject.domain_options}
					bind:value={subject.domain}
					on:change={async () => await subject.save('domain')}
					/>

				<span class="preview" style:background-color={subject.color} />
			</div>
		{/if}
	{/each}
</div>

<!-- Subject relations -->
<div id="subjects" class="relations editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Relations </h2>
		<LinkButton href="#subjects"> go to subjects </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={relation_query} />
		<Button on:click={() => { SubjectRelation.create($graph); update() }}>
			<img src={plusIcon} alt=""> New Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if $graph.subject_relations.some(relation => relationMatchesQuery(relation_query, relation))}

		<!-- Header -->
		<div class=row>

			<!-- From label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> From </span>
				<IconButton
					src={sortIcon(relation_parent_sort)}
					on:click={() => {
						relation_child_sort = undefined
						relation_parent_sort = !relation_parent_sort
						$graph.sort(SortOption.relations | SortOption.subjects | SortOption.parent, relation_parent_sort)
						update()
					}}
				/>
			</div>

			<!-- To label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> To </span>
				<IconButton
					src={sortIcon(relation_child_sort)}
					on:click={() => {
						relation_parent_sort = undefined
						relation_child_sort = !relation_child_sort
						$graph.sort(SortOption.relations | SortOption.subjects | SortOption.child, relation_child_sort)
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
	{#each $graph.subject_relations as relation}
		{#if relationMatchesQuery(relation_query, relation)}
			<div class="row" id={relation.anchor}>
				<Validation short data={relation.validate()} />
				<span> {relation.index + 1} </span>
				<IconButton scale
					src={trashIcon}
					on:click={async () => {
						relation.delete()
						await relation.parent?.save('children')
						await relation.child?.save('parents')
						update()
					}}
					/>

				<Dropdown
					label="Parent"
					placeholder="From Subject"
					options={relation.parent_options}
					bind:value={relation.parent}
					on:change={async () => {
						await relation.parent?.save('children')
						await relation.child?.save('parents')
					}}
					/>

				<span class="preview" style:background-color={relation.parent_color} />
				<Dropdown
					label="Child"
					placeholder="To Subject"
					options={relation.child_options}
					bind:value={relation.child}
					on:change={async () => {
						await relation.parent?.save('children')
						await relation.child?.save('parents')
					}}
					/>

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
			flex-flow: row nowrap
			margin-bottom: $form-big-gap
			gap: $form-small-gap

		.row
			display: grid
			place-items: center center
			gap: $form-small-gap

			padding-right: calc( $form-small-gap + $icon-width )

			.preview
				width: $input-icon-size
				height: $input-icon-size

			.header
				display: flex
				flex-flow: row nowrap
				align-content: center
				justify-content: right
				width: 100%

				span
					flex: 1

	.subjects .row
		grid-template: "validation id delete left right right-preview" auto / $icon-width $icon-width $icon-width 1fr 1fr $icon-width

	.relations .row
		grid-template: "validation id delete left left-preview right right-preview" auto / $icon-width $icon-width $icon-width 1fr $icon-width 1fr $icon-width

</style>
