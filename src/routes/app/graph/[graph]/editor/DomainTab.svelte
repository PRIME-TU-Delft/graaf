<script lang="ts">

	const SCROLL_ON_NEW = 60

	// Internal dependencies
	import { graph, domain_query, save_status } from './stores'

	import {
		DomainController,
		DomainRelationController
	} from '$scripts/controllers'

	// Components
	import DomainRow from './DomainRow.svelte'
	import RelationRow from './RelationRow.svelte'

	import SortableList from '$components/SortableList.svelte'
	import OrderedList from '$components/OrderedList.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'
	import Feedback from '$components/Feedback.svelte';
	import { handleError } from '$scripts/utility';

	// Variables
	$: filtered_domains = $graph.domains.filter(domain => domain.matchesQuery($domain_query))
	$: filtered_relations = $graph.domain_relations.filter(relation => relation.matchesQuery($domain_query))

</script>

<!-- Markdown -->

<div class="tab">

	<!-- Domains -->
	{#if filtered_domains.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<div class="domain-row list-header">
			<h4 style="grid-area: name"> Name </h4>
			<h4 style="grid-area: style"> Style </h4>
		</div>

		<SortableList 
			list={filtered_domains} 
			on:rearrange={async event => {
				try {
					await $graph.reorderDomains(event.detail, $save_status)
					$graph = $graph // Trigger reactivity
				} catch (error) {
					handleError(error, $save_status)
				}
			}}
		>
			<svelte:fragment slot="left" let:item>
				<Feedback compact data={item.validate(false)} />
			</svelte:fragment>

			<svelte:fragment slot="right" let:item>
				<DomainRow domain={item} />
			</svelte:fragment>
		</SortableList>
	{/if}

	<!-- New domain -->
	<button
		class="row-button"
		on:click={async () => {
			try {
				await DomainController.create($graph.cache, $graph, $save_status)
				$graph = $graph // Trigger reactivity
				setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
			} catch (error) {
				handleError(error, $save_status)
			}
		}}
	> <img src={plus_icon} alt="New domain"> </button>

	<!-- Divider -->
	<div class="divider" id="scroll-divider">
		<div class="line" />
		<h3> Relations </h3>
		<div class="line" />
	</div>

	<!-- Domain Relations -->
	{#if filtered_relations.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<div class="relation-row list-header">
			<h4 style="grid-area: parent"> Parent </h4>
			<h4 style="grid-area: child"> Child </h4>
		</div>

		<OrderedList let:item list={filtered_relations}>
			<RelationRow relation={item} />
		</OrderedList>
	{/if}

	<!-- New domain relation -->
	<button 
		class="row-button"	
		on:click={ async () => {
			try {
				await DomainRelationController.create($graph)
				$graph = $graph // Trigger reactivity
				setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
			} catch (error) {
				handleError(error, $save_status)
			}
		}}
	> <img src={plus_icon} alt="New relation"> </button>
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>