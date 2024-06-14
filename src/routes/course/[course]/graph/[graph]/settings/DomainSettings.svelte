
<script lang="ts">

	// Internal imports
	import { Graph, Domain, DomainRelation, Relation } from '$scripts/entities'
	import { styles } from '$scripts/settings'

	// Components
	import Button from '$components/Button.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import IconButton from '$components/IconButton.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Modal from '$components/Modal.svelte'

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
	let domainQuery: string = ''
	let domainNameSort: boolean | undefined
	let domainStyleSort: boolean | undefined

	let relationQuery: string = ''
	let relationFromSort: boolean | undefined
	let relationToSort: boolean | undefined

	let inferModal: Modal

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

	function alphabetize<T>(list: T[], key: (item: T) => string, ascending: boolean = true) {
		/* Alphabetizes list */

		list.sort((a, b) => key(a).localeCompare(key(b)))
		if (!ascending) list.reverse()
	}

</script>



<!-- Markup -->



<!-- Domains -->
<div id="domains" class="domains">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Domains </h2>
		<LinkButton href="#relations"> goto relations </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={domainQuery} />
		<Button on:click={() => { Domain.create(graph); update() }}>
			<img src={plusIcon} alt=""> New Domain
		</Button>
	</div>
	
	<!-- Header -->
	{#if graph.domains.some(domain => domainMatchesQuery(domainQuery, domain))}

		<!-- If any domains were found that match the search -->
		<div class=row>

			<!-- Name label and sort button -->
			<div class="header" style="grid-area: left;">
				<span> Name </span>
				<IconButton
					src={domainNameSort === undefined ? neutralSortIcon : domainNameSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						domainStyleSort = undefined
						domainNameSort = !domainNameSort
						alphabetize(graph.domains, domain => domain.name || '', domainNameSort)
						update()
					}}
				/>
			</div>

			<!-- Style label and sort button -->
			<div class="header" style="grid-area: right;">
				<span> Style </span>
				<IconButton
					src={domainStyleSort === undefined ? neutralSortIcon : domainStyleSort ? ascendingSortIcon : descedingSortIcon}
					on:click={() => {
						domainNameSort = undefined
						domainStyleSort = !domainStyleSort
						alphabetize(graph.domains, domain => domain.style ? styles[domain.style].display_name : '', domainStyleSort)
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
	{#each graph.domains as domain}
		{#if domainMatchesQuery(domainQuery, domain)}
			<div class="row">
				<span> {domain.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { domain.delete(); update() }} />
				<Textfield label="Name" placeholder="Domain Name" bind:value={domain.name} on:input={update} />
				<Dropdown label="Style" placeholder="Domain Style" options={domain.style_options} bind:value={domain.style} on:change={update}/>
				<span class="preview" style:background-color={domain.color} />
			</div>
		{/if}
	{/each}
</div>

<!-- Domain relations -->
<div id="relations" class="relations">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Relations </h2>
		<LinkButton href="#domains"> goto domains </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={relationQuery} />

		<Button on:click={() => { DomainRelation.create(graph); update() }}>
			<img src={plusIcon} alt=""> New Relation
		</Button>
	</div>

	<!-- If any relations were found that match the search -->
	{#if graph.domain_relations.some(relation => relationMatchesQuery(relationQuery, relation))}

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
						alphabetize(graph.domain_relations, relation => relation.parent?.name || '', relationFromSort)
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
						alphabetize(graph.domain_relations, relation => relation.child?.name || '', relationToSort)
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
	{#each graph.domain_relations as relation}
		{#if relationMatchesQuery(relationQuery, relation)}
			<div class="row">
				<span> {relation.id} </span>
				<IconButton scale src={trashIcon} on:click={() => {
					relation.delete()
					update()
				}} />

				<Dropdown label="Parent" placeholder="From Domain" options={relation.parent_options} bind:value={relation.parent} on:change={update} />
				<span class="preview" style:background-color={relation.parent_color} />
				<Dropdown label="Child" placeholder="To Domain" options={relation.child_options} bind:value={relation.child} on:change={update} />
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

	.domains, .relations
		display: flex
		flex-flow: column nowrap
		padding: $card-thick-padding
		gap: $form-small-gap

		.row
			display: grid
			place-items: center center
			gap: $form-small-gap

	.domains .row
		grid-template: "id delete left right right-preview" auto / $icon-width $icon-width 1fr 1fr $icon-width

	.relations .row
		grid-template: "id delete left left-preview right right-preview" auto / $icon-width $icon-width 1fr $icon-width 1fr $icon-width

</style>
