
<script lang="ts">

	// Internal dependencies
	import { ControllerCache, DomainController, GraphController } from '$scripts/controllers'

	// Components
	import Searchbar from '$components/forms/Search.svelte'
	import Button from '$components/buttons/Button.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'

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
	function sort(options: SortOption) {
		if (options & SortOption.domains) {
			domain_index_sort = options & SortOption.index ? !domain_index_sort : undefined
			domain_name_sort = options & SortOption.name ? !domain_name_sort : undefined
			domain_style_sort = options & SortOption.style ? !domain_style_sort : undefined
			const direction = domain_index_sort || domain_name_sort || domain_style_sort ? SortOption.ascending : SortOption.descending
		}

		graph.sort(options | direction)
		update()
	}

	// Variables
	let domain_index_sort: boolean | undefined = undefined
	let domain_name_sort: boolean | undefined = undefined
	let domain_style_sort: boolean | undefined = undefined
	let domain_query: string = ''

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

	<!-- Header -->
	{#await graph.getDomains() then domains}
		{#if domains.some(domain => domain.matchesQuery(domain_query))}

			<div class=row>

				<!-- Name label and sort button -->
				<div class="header" style="grid-area: left;">
					<span> Name </span>
					<IconButton
						description={domain_name_sort ? 'Sort domains descending by name' : 'Sort domains ascending by name'}
						src={domain_name_sort === undefined ? neutralSortIcon : domain_name_sort ? ascendingSortIcon : descendingSortIcon}
						on:click={() => sort(SortOption.domains | SortOption.name)}
					/>
				</div>

				<!-- Style label and sort button -->
				<div class="header" style="grid-area: right;">
					<span> Style </span>
					<IconButton
						description={domain_style_sort ? 'Sort domains descending by style' : 'Sort domains ascending by style'}
						src={sortIcon(domain_style_sort)}
						on:click={() => sort(SortOption.domains | SortOption.style)}
					/>
				</div>
			</div>

			{#each domains as domain}
				{#if domain.matchesQuery(domain_query)}
					<div class="row" id={domain.uuid}>
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

		{:else}

			<h6 class="grayed"> No domains found </h6>

		{/if}
	{/await}
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
			<div class="row" id={domain.uuid}>
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