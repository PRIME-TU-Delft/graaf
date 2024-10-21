
<script lang="ts">

	// Internal dependencies
	import {
		ControllerCache,
		GraphController,
		DomainController,
		SortOption
	} from '$scripts/controllers'

	// Components
	import Searchbar from '$components/forms/Search.svelte'
	import Button from '$components/buttons/Button.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'
	import IconButton from '$components/buttons/IconButton.svelte'
	import DomainRow from './DomainRow.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import ascendingSortIcon from '$assets/ascending-sort-icon.svg'
	import descendingSortIcon from '$assets/descending-sort-icon.svg'
	import neutralSortIcon from '$assets/neutral-sort-icon.svg'

	// Exports
	export let cache: ControllerCache
	export let graph: GraphController
	export let update: () => void

	// Functions
	async function sort(options: number) {
		let direction: number

		if (options & SortOption.relations) {
			relation_index_sort = options & SortOption.index ? !relation_index_sort : undefined
			relation_parent_sort = options & SortOption.parents ? !relation_parent_sort : undefined
			relation_child_sort = options & SortOption.children ? !relation_child_sort : undefined
			direction = relation_index_sort || relation_parent_sort || relation_child_sort ? SortOption.ascending : SortOption.descending
		} else {
			domain_index_sort = options & SortOption.index ? !domain_index_sort : undefined
			domain_name_sort = options & SortOption.name ? !domain_name_sort : undefined
			domain_style_sort = options & SortOption.style ? !domain_style_sort : undefined
			direction = domain_index_sort || domain_name_sort || domain_style_sort ? SortOption.ascending : SortOption.descending
		}

		await graph.sort(options | direction)
		update()
	}

	// Variables
	let domain_index_sort: boolean | undefined = undefined
	let domain_name_sort: boolean | undefined = undefined
	let domain_style_sort: boolean | undefined = undefined
	let domain_query: string = ''

	let relation_index_sort: boolean | undefined = undefined
	let relation_parent_sort: boolean | undefined = undefined
	let relation_child_sort: boolean | undefined = undefined
	let relation_query: string = ''

</script>


<!-- Markup -->


<div id="domains" class="domains editor">

	<!-- Toolbar -->
	<div class="toolbar">
		<h2> Domains </h2>
		<LinkButton href="#relations"> go to relations </LinkButton>

		<div class="flex-spacer" />

		<Searchbar bind:value={domain_query} />
		<Button
			on:click={async () => {
				await DomainController.create(cache, graph)
				update()
			}}
		>
			<img src={plusIcon} alt="New domain"> New Domain
		</Button>
	</div>

	{#await graph.getDomains().then(domains => domains.filter(async domain => await domain.matchesQuery(domain_query))) then domains}
		{#if domains.length > 0}

			<!-- Header -->
			<div class=row>

				<div class="header" style="grid-area: index;">
					<IconButton
						description={domain_index_sort ? 'Sort domains descending by index' : 'Sort domains ascending by index'}
						src={domain_index_sort === undefined ? neutralSortIcon : domain_index_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.domains | SortOption.index)}
						/>

				</div>

				<!-- Name label and sort button -->
				<div class="header" style="grid-area: left;">
					<span> Name </span>
					<IconButton
						description={domain_name_sort ? 'Sort domains descending by name' : 'Sort domains ascending by name'}
						src={domain_name_sort === undefined ? neutralSortIcon : domain_name_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.domains | SortOption.name)}
						/>
				</div>

				<!-- Style label and sort button -->
				<div class="header" style="grid-area: right;">
					<span> Style </span>
					<IconButton
						description={domain_style_sort ? 'Sort domains descending by style' : 'Sort domains ascending by style'}
						src={domain_style_sort === undefined ? neutralSortIcon : domain_style_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.domains | SortOption.style)}
						/>
				</div>
			</div>

			<!-- Domains -->
			{#each domains as domain}
				<DomainRow domain={domain} update={update} />
			{/each}
			
		{:else}

			<h6 class="grayed"> No domains found </h6>

		{/if}
	{/await}
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
		grid-template: "validation index delete left right right-preview" auto / $icon-width $icon-width $icon-width 1fr 1fr $icon-width

	.relations .row
		grid-template: "validation index delete left left-preview right right-preview" auto / $icon-width $icon-width $icon-width 1fr $icon-width 1fr $icon-width

</style>