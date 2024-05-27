
<script lang="ts">

	// Internal imports
	import { Graph, Domain, Field, Relation, DomainRelation } from '$scripts/graph/entities'
	import { styles } from '$scripts/graph/settings'

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
	let domainQuery: string = ''
	let domainIdSort: boolean | null = true
	let domainFromSort: boolean | null = null
	let domainToSort: boolean | null = null
	let relationQuery: string = ''
	let relationIdSort: boolean | null = true
	let relationFromSort: boolean | null = null
	let relationToSort: boolean | null = null

	$: styleOptions = Object.keys(styles).map(style => ({
		name: styles[style].display_name,
		value: style
	}))

	// Force reactivity update
	function update() {
		graph = graph // Maybe redundant Svelte 5?
	}

	// Checks if query appears in domain
	function domainMatchesQuery(query: string, domain: Domain): boolean {
		if (!query) return true
		query = query.toLowerCase()

		let name = domain.name?.toLowerCase()
		let style = domain.style ? styles[domain.style].display_name.toLowerCase() : undefined

		return name?.includes(query) || style?.includes(query) || false
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

	<!-- If any domains were found that match the search -->
	{#if graph.domains.some(domain => domainMatchesQuery(domainQuery, domain))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={domainIdSort === null ? neutralSortIcon : domainIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					domainIdSort = !domainIdSort
					domainFromSort = domainToSort = null
					graph.domains.sort((a, b) => (a.id - b.id) * (domainIdSort ? 1 : -1))
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
						graph.domains.sort((a, b) => {
							let astr = a.name || ''
							let bstr = b.name || ''
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
						graph.domains.sort((a, b) => {
							let astr = a.style ? styles[a.style].display_name : ''
							let bstr = b.style ? styles[b.style].display_name : ''
							return astr.localeCompare(bstr) * (domainToSort ? 1 : -1)
						})

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
				<Textfield label="Name" placeholder="Domain Name" bind:value={domain.name} />
				<Dropdown label="Style" placeholder="Domain Style" options={styleOptions} bind:value={domain.style}/>
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
	{#if graph.domainRelations.some(relation => relationMatchesQuery(relationQuery, relation))}

		<!-- Header -->
		<div class=row>

			<!-- ID sort button -->
			<IconButton
				src={relationIdSort === null ? neutralSortIcon : relationIdSort ? ascendingSortIcon : descedingSortIcon}
				on:click={() => {
					relationIdSort = !relationIdSort
					relationFromSort = relationToSort = null
					graph.domainRelations.sort((a, b) => (a.id - b.id) * (relationIdSort ? 1 : -1))
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
						graph.domainRelations.sort((a, b) => {
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
						graph.domainRelations.sort((a, b) => {
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
		<h6 class="grayed"> No relations found </h6>

	{/if}

	<!-- List of relations -->
	{#each graph.domainRelations as relation}
		{#if relationMatchesQuery(relationQuery, relation)}
			<div class="row">
				<span> {relation.id} </span>
				<IconButton scale src={trashIcon} on:click={() => { relation.delete(); update() }} />
				<Dropdown label="Parent" placeholder="From Domain" options={relation.parentOptions} bind:value={relation.parent} />
				<span class="preview" style:background-color={relation.parentColor} />
				<Dropdown label="Child" placeholder="To Domain" options={relation.childOptions} bind:value={relation.child} />
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
