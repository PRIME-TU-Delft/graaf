
<script lang="ts">

	// Internal dependencies
	import { cache, graph, domains, domain_relations } from './stores'
	import {
		DomainController,
		DomainRelationController,
		SortOption
	} from '$scripts/controllers'

	// Components
	import DomainRow from './DomainRow.svelte'
	import DomainRelationRow from './DomainRelationRow.svelte'

	import Searchbar from '$components/Search.svelte'
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descendingSortIcon from '$assets/descending-sort-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'

	// Exports
	export let update: () => void

	// Functions

	/**
	 * Figures what parameter we are currently sorting on, based on the given sort options.
	 * Can be called with just SortOption.domains or SortOption.relations to unset all sorting of that type.
	 * @param options - Sort options
	 */

	function updateSortmode(options: number) {
		if (options & SortOption.relation) {
			relation_index_sort = options & SortOption.index ? !relation_index_sort : undefined
			relation_parent_sort = options & SortOption.parent ? !relation_parent_sort : undefined
			relation_child_sort = options & SortOption.child ? !relation_child_sort : undefined
		} else {
			domain_index_sort = options & SortOption.index ? !domain_index_sort : undefined
			domain_name_sort = options & SortOption.name ? !domain_name_sort : undefined
			domain_style_sort = options & SortOption.style ? !domain_style_sort : undefined
		}
	}

	/**
	 * Sorts the graph based on the given options.
	 * @param options - Sort options
	 */

	async function sort(options: number) {
		if ($graph === undefined) return

		// Update sortmode and find direction
		updateSortmode(options)
		let direction = relation_index_sort  ||
						relation_parent_sort ||
						relation_child_sort  ||
						domain_index_sort    ||
						domain_name_sort     ||
						domain_style_sort ? SortOption.ascending : SortOption.descending

		// Sort
		await $graph.sort(options | direction)
		update()
	}

	// Variables
	let domain_index_sort: boolean | undefined = undefined
	let domain_name_sort: boolean | undefined = undefined
	let domain_style_sort: boolean | undefined = undefined
	let domain_query: string = ''

	$: filtered_domains = $domains?.filter(domain => domain.matchesQuery(domain_query))

	let relation_index_sort: boolean | undefined = undefined
	let relation_parent_sort: boolean | undefined = undefined
	let relation_child_sort: boolean | undefined = undefined
	let relation_query: string = ''

	$: filtered_relations = $domain_relations?.filter(relation => relation.matchesQuery(relation_query))

</script>


<!-- Markup -->


<!-- Domains -->
{#if $graph === undefined || $cache === undefined}
	<p class="grayed"> Loading... </p>
{:else}
	<div id="domains" class="editor">

		<!-- Toolbar -->
		<div class="toolbar">
			<h2> Domains </h2>
			<LinkButton href="#relations"> go to relations </LinkButton>

			<div class="flex-spacer" />

			<Searchbar bind:value={domain_query} />
			<Button
				on:click={async () => {
					await DomainController.create($cache, $graph)
					update()
				}}
			>
				<img src={plusIcon} alt="New domain"> New Domain
			</Button>
		</div>

		{#if filtered_domains === undefined}
			<p class="grayed"> Loading... </p>
		{:else if filtered_domains.length === 0}
			<p class="grayed"> There's nothing here </p>
		{:else}
			<div class="row">

				<!-- Index label and sort button -->
				<div class="header" style="grid-area: index;">
					<IconButton
						description={domain_index_sort ? 'Sort domains descending by index' : 'Sort domains ascending by index'}
						src={domain_index_sort === undefined ? neutralSortIcon : domain_index_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.domain | SortOption.index)}
					/>
				</div>

				<!-- Name label and sort button -->
				<div class="header" style="grid-area: left;">
					<span> Name </span>
					<IconButton
						description={domain_name_sort ? 'Sort domains descending by name' : 'Sort domains ascending by name'}
						src={domain_name_sort === undefined ? neutralSortIcon : domain_name_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.domain | SortOption.name)}
					/>
				</div>

				<!-- Style label and sort button -->
				<div class="header" style="grid-area: right;">
					<span> Style </span>
					<IconButton
						description={domain_style_sort ? 'Sort domains descending by style' : 'Sort domains ascending by style'}
						src={domain_style_sort === undefined ? neutralSortIcon : domain_style_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.domain | SortOption.style)}
					/>
				</div>
			</div>

			{#each filtered_domains as domain}
				<DomainRow {domain} {update} {updateSortmode} />
			{/each}
		{/if}
	</div>
{/if}

<!-- Relations -->
{#if $graph === undefined || $cache === undefined}
	<p class="grayed"> Loading... </p>
{:else}
	<div id="relations" class="editor">

		<!-- Toolbar -->
		<div class="toolbar">
			<h2> Relations </h2>
			<LinkButton href="#domains"> go to domains </LinkButton>

			<div class="flex-spacer" />

			<Searchbar bind:value={relation_query} />
			<Button
				on:click={async () => {
					await DomainRelationController.create($graph)
					update()
				}}
			>
				<img src={plusIcon} alt="New domain"> New Relation
			</Button>
		</div>

		{#if filtered_relations === undefined}
			<p class="grayed"> Loading... </p>
		{:else if filtered_relations.length === 0}
			<p class="grayed"> There's nothing here </p>
		{:else}
			<div class="relation row">

				<!-- Index label and sort button -->
				<div class="header" style="grid-area: index;">
					<IconButton
						description={relation_index_sort ? 'Sort relations descending by index' : 'Sort relations ascending by index'}
						src={relation_index_sort === undefined ? neutralSortIcon : relation_index_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.relation | SortOption.domain | SortOption.index)}
					/>
				</div>

				<!-- Parent label and sort button -->
				<div class="header" style="grid-area: left;">
					<span> Parent </span>
					<IconButton
						description={relation_parent_sort ? 'Sort relations descending by parent' : 'Sort relations ascending by parent'}
						src={relation_parent_sort === undefined ? neutralSortIcon : relation_parent_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.relation | SortOption.domain | SortOption.parent)}
					/>
				</div>

				<!-- Child label and sort button -->
				<div class="header" style="grid-area: right;">
					<span> Child </span>
					<IconButton
						description={relation_child_sort ? 'Sort relations descending by child' : 'Sort relations ascending by child'}
						src={relation_child_sort === undefined ? neutralSortIcon : relation_child_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.relation | SortOption.domain | SortOption.child)}
					/>
				</div>
			</div>

			{#each filtered_relations as relation}
				<DomainRelationRow {relation} {update} {updateSortmode} />
			{/each}
		{/if}
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@import './style.sass'

</style>