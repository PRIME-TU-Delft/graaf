
<script lang="ts">

	// Internal imports
	import { Domain, DomainRelation, SortOption } from '$scripts/entities'
	import { styles } from '$scripts/settings'
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
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descedingSortIcon from '$assets/descending-sort-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'
	import plusIcon from '$assets/plus-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	// Functions
	function domainMatchesQuery(query: string, domain: Domain): boolean {
		/* Checks if query appears in domain */

		if (!query) return true
		query = query.toLowerCase()

		let name = domain.name?.toLowerCase()
		let style = domain.style ? styles[domain.style].display_name.toLowerCase() : undefined

		return name?.includes(query) || style?.includes(query) || false
	}

	function relationMatchesQuery(query: string, relation: DomainRelation): boolean {
		/* Checks if query appears in relation */

		if (!query) return true
		query = query.toLowerCase()

		let parent = relation.parent?.name?.toLowerCase()
		let child = relation.child?.name?.toLowerCase()

		return parent?.includes(query) || child?.includes(query) || false
	}

	function sortIcon(state?: boolean): string {
		/* Returns the sort icon based on the state */

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
	let domain_query: string = ''
	let domain_name_sort: boolean | undefined
	let domain_style_sort: boolean | undefined

	let relation_query: string = ''
	let relation_parent_sort: boolean | undefined
	let relation_child_sort: boolean | undefined

</script>


<!-- Markup -->


<!-- Domains -->
<div id="domains" class="domains editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Domains </h2>
		<LinkButton href="#relations"> go to relations </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={domain_query} />
		<Button on:click={async () => { await Domain.create($graph); update() }}>
			<img src={plusIcon} alt=""> New Domain
		</Button>
	</div>

	<!-- Header -->
	{#if $graph.domains.some(domain => domainMatchesQuery(domain_query, domain))}

		<!-- If any domains were found that match the search -->
		<div class=row>

			<!-- Name label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> Name </span>
				<IconButton
					src={sortIcon(domain_name_sort)}
					on:click={() => {
						domain_style_sort = undefined
						domain_name_sort = !domain_name_sort

						const options = domain_name_sort ? SortOption.descending : SortOption.ascending
						$graph.sort(options | SortOption.domains | SortOption.name)
						update()
					}}
				/>
			</div>

			<!-- Style label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> Style </span>
				<IconButton
					src={sortIcon(domain_style_sort)}
					on:click={() => {
						domain_name_sort = undefined
						domain_style_sort = !domain_style_sort
						
						const options = domain_style_sort ? SortOption.descending : SortOption.ascending
						$graph.sort(options | SortOption.domains | SortOption.style)
						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no domains were found that match the search -->
		<h6 class="grayed"> No domains found </h6>

	{/if}

	<!-- Domain list -->
	{#each $graph.domains as domain}
		{#if domainMatchesQuery(domain_query, domain)}
			<div class="row" id={domain.anchor}>
				<Validation short data={domain.validate()} />
				<span> {domain.index + 1} </span>
				<IconButton scale
					src={trashIcon}
					on:click={async () => {
						await domain.delete()
						update()
					}}
					/>

				<Textfield
					label="Name"
					placeholder="Domain Name"
					bind:value={domain.name}
					on:change={async () => await domain.save()}
					/>

				<Dropdown
					label="Style"
					placeholder="Domain Style"
					options={domain.style_options}
					bind:value={domain.style}
					on:change={async () => await domain.save()}
					/>

				<span class="preview" style:background-color={domain.color} />
			</div>
		{/if}
	{/each}
</div>

<!-- Domain relations -->
<div id="relations" class="relations editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Relations </h2>
		<LinkButton href="#domains"> go to domains </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={relation_query} />
		<Button on:click={() => { DomainRelation.create($graph); update() }}>
			<img src={plusIcon} alt=""> New Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if $graph.domain_relations.some(relation => relationMatchesQuery(relation_query, relation))}

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

						const options = relation_parent_sort ? SortOption.descending : SortOption.ascending
						$graph.sort(options | SortOption.relations | SortOption.domains | SortOption.parent)
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

						const options = relation_child_sort ? SortOption.descending : SortOption.ascending
						$graph.sort(options | SortOption.relations | SortOption.domains | SortOption.child)
						update()
					}}
				/>
			</div>
		</div>

	{:else}

		<!-- If no relations were found that match the search -->
		<h6 class="grayed"> No relations found </h6>

	{/if}

	<!-- List of relations -->
	{#each $graph.domain_relations as relation}
		{#if relationMatchesQuery(relation_query, relation)}
			<div class="row" id={relation.anchor}>
				<Validation short data={relation.validate()} />
				<span> {relation.index + 1} </span>
				<IconButton scale
					src={trashIcon}
					on:click={async () => {
						relation.delete()
						await relation.parent?.save()
						await relation.child?.save()
						update()
					}}
					/>

				<Dropdown
					label="Parent"
					placeholder="From Domain"
					options={relation.parent_options}
					bind:value={relation.parent}
					on:change={async () => {
						await relation.parent?.save()
						await relation.child?.save()
					}}
					/>

				<span class="preview" style:background-color={relation.parent_color} />
				<Dropdown
					label="Child"
					placeholder="To Domain"
					options={relation.child_options}
					bind:value={relation.child}
					on:change={async () => {
						await relation.parent?.save()
						await relation.child?.save()
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

	.domains .row
		grid-template: "validation id delete left right right-preview" auto / $icon-width $icon-width $icon-width 1fr 1fr $icon-width

	.relations .row
		grid-template: "validation id delete left left-preview right right-preview" auto / $icon-width $icon-width $icon-width 1fr $icon-width 1fr $icon-width

</style>
