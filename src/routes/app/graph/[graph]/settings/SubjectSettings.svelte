
<script lang="ts">

	// Internal dependencies
	import { cache, graph, subjects, subject_relations } from './stores'
	import {
		SubjectController,
		SubjectRelationController,
		SortOption
	} from '$scripts/controllers'

	// Components
	import SubjectRow from './SubjectRow.svelte'
	import SubjectRelationRow from './SubjectRelationRow.svelte'

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
	 * Can be called with just SortOption.subjects or SortOption.relations to unset all sorting of that type.
	 * @param options - Sort options
	 */

	function updateSortmode(options: number) {
		if (options & SortOption.relation) {
			relation_index_sort = options & SortOption.index ? !relation_index_sort : undefined
			relation_parent_sort = options & SortOption.parent ? !relation_parent_sort : undefined
			relation_child_sort = options & SortOption.child ? !relation_child_sort : undefined
		} else {
			subject_index_sort = options & SortOption.index ? !subject_index_sort : undefined
			subject_name_sort = options & SortOption.name ? !subject_name_sort : undefined
			subject_domain_sort = options & SortOption.domain ? !subject_domain_sort : undefined
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
						subject_index_sort    ||
						subject_name_sort     ||
						subject_domain_sort ? SortOption.ascending : SortOption.descending

		// Sort
		await $graph.sort(options | direction)
		update()
	}

	// Variables
	let subject_index_sort: boolean | undefined = undefined
	let subject_name_sort: boolean | undefined = undefined
	let subject_domain_sort: boolean | undefined = undefined
	let subject_query: string = ''

	$: filtered_subjects = $subjects?.filter(subject => subject.matchesQuery(subject_query))

	let relation_index_sort: boolean | undefined = undefined
	let relation_parent_sort: boolean | undefined = undefined
	let relation_child_sort: boolean | undefined = undefined
	let relation_query: string = ''

	$: filtered_relations = $subject_relations?.filter(relation => relation.matchesQuery(relation_query))

</script>


<!-- Markup -->


<!-- Subjects -->
{#if $graph === undefined || $cache === undefined}
	<p class="grayed"> Loading... </p>
{:else}
	<div id="subjects" class="editor">

		<!-- Toolbar -->
		<div class="toolbar">
			<h2> Subjects </h2>
			<LinkButton href="#relations"> go to relations </LinkButton>

			<div class="flex-spacer" />

			<Searchbar bind:value={subject_query} />
			<Button
				on:click={async () => {
					await SubjectController.create($cache, $graph)
					update()
				}}
			>
				<img src={plusIcon} alt="New subject"> New Subject
			</Button>
		</div>

		{#if filtered_subjects === undefined}
			<p class="grayed"> Loading... </p>
		{:else if filtered_subjects.length === 0}
			<p class="grayed"> There's nothing here </p>
		{:else}
			<div class="row">

				<!-- Index label and sort button -->
				<div class="header" style="grid-area: index;">
					<IconButton
						description={subject_index_sort ? 'Sort subjects descending by index' : 'Sort subjects ascending by index'}
						src={subject_index_sort === undefined ? neutralSortIcon : subject_index_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.subject | SortOption.index)}
					/>
				</div>

				<!-- Name label and sort button -->
				<div class="header" style="grid-area: left;">
					<span> Name </span>
					<IconButton
						description={subject_name_sort ? 'Sort subjects descending by name' : 'Sort subjects ascending by name'}
						src={subject_name_sort === undefined ? neutralSortIcon : subject_name_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.subject | SortOption.name)}
					/>
				</div>

				<!-- Domain label and sort button -->
				<div class="header" style="grid-area: right;">
					<span> Domain </span>
					<IconButton
						description={subject_domain_sort ? 'Sort subjects descending by domain' : 'Sort subjects ascending by domain'}
						src={subject_domain_sort === undefined ? neutralSortIcon : subject_domain_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.subject | SortOption.domain)}
					/>
				</div>
			</div>

			{#each filtered_subjects as subject}
				<SubjectRow {subject} {update} {updateSortmode} />
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
			<LinkButton href="#subjects"> go to subjects </LinkButton>

			<div class="flex-spacer" />

			<Searchbar bind:value={relation_query} />
			<Button
				on:click={async () => {
					await SubjectRelationController.create($graph)
					update()
				}}
			>
				<img src={plusIcon} alt="New subject"> New Relation
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
						on:click={() => sort(SortOption.relation | SortOption.subject | SortOption.index)}
					/>
				</div>

				<!-- Parent label and sort button -->
				<div class="header" style="grid-area: left;">
					<span> Parent </span>
					<IconButton
						description={relation_parent_sort ? 'Sort relations descending by parent' : 'Sort relations ascending by parent'}
						src={relation_parent_sort === undefined ? neutralSortIcon : relation_parent_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.relation | SortOption.subject | SortOption.parent)}
					/>
				</div>

				<!-- Child label and sort button -->
				<div class="header" style="grid-area: right;">
					<span> Child </span>
					<IconButton
						description={relation_child_sort ? 'Sort relations descending by child' : 'Sort relations ascending by child'}
						src={relation_child_sort === undefined ? neutralSortIcon : relation_child_sort ? descendingSortIcon : ascendingSortIcon}
						on:click={() => sort(SortOption.relation | SortOption.subject | SortOption.child)}
					/>
				</div>
			</div>

			{#each filtered_relations as relation}
				<SubjectRelationRow {relation} {update} {updateSortmode} />
			{/each}
		{/if}
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@import './style.sass'

</style>