<script lang="ts">
	const SCROLL_ON_NEW = 60;

	// Internal dependencies
	import { graph, domain_query } from './stores';

	import { DomainController, DomainRelationController } from '$scripts/controllers';

	// Components
	import DomainRow from './DomainRow.svelte';
	import RelationRow from './RelationRow.svelte';

	import SortableList from '$components/SortableList.svelte';
	import OrderedList from '$components/OrderedList.svelte';

	// Assets
	import plus_icon from '$assets/plus-icon.svg';
	import Feedback from '$components/Feedback.svelte';

	// Variables
	let filtered_domains = $derived(
		$graph.domains.filter((domain) => domain.matchesQuery($domain_query))
	);
	let filtered_relations = $derived(
		$graph.domain_relations.filter((relation) => relation.matchesQuery($domain_query))
	);
</script>

<!-- Markdown -->

<div class="tab">
	<!-- Domains -->
	{#if filtered_domains.length === 0}
		<p class="grayed">There's nothing here</p>
	{:else}
		<div class="domain-row list-header">
			<h4 style="grid-area: name">Name</h4>
			<h4 style="grid-area: style">Style</h4>
		</div>

		<SortableList
			list={filtered_domains}
			onrearange={async (event) => {
				await $graph.reorderDomains(event.detail);
				$graph = $graph; // Trigger reactivity
			}}
		>
			{#snippet left({ item })}
				<Feedback compact data={item.validate(false)} />
			{/snippet}

			{#snippet right({ item })}
				<DomainRow domain={item} />
			{/snippet}
		</SortableList>
	{/if}

	<!-- New domain -->
	<button
		class="row-button"
		onclick={async () => {
			await DomainController.create($graph.cache, $graph);
			$graph = $graph; // Trigger reactivity
			setTimeout(() => scrollBy({ top: SCROLL_ON_NEW, behavior: 'smooth' }), 0);
		}}
	>
		<img src={plus_icon} alt="New domain" />
	</button>

	<!-- Divider -->
	<div class="divider" id="scroll-divider">
		<div class="line"></div>
		<h3>Relations</h3>
		<div class="line"></div>
	</div>

	<!-- Domain Relations -->
	{#if filtered_relations.length === 0}
		<p class="grayed">There's nothing here</p>
	{:else}
		<div class="relation-row list-header">
			<h4 style="grid-area: parent">Parent</h4>
			<h4 style="grid-area: child">Child</h4>
		</div>

		<OrderedList list={filtered_relations}>
			{#snippet children({ item })}
				<RelationRow relation={item} />
			{/snippet}
		</OrderedList>
	{/if}

	<!-- New domain relation -->
	<button
		class="row-button"
		onclick={async () => {
			await DomainRelationController.create($graph);
			$graph = $graph; // Trigger reactivity
			setTimeout(() => scrollBy({ top: SCROLL_ON_NEW, behavior: 'smooth' }), 0);
		}}
	>
		<img src={plus_icon} alt="New relation" />
	</button>
</div>

<!-- Styles -->

<style lang="sass">

	@import "./styles.sass"

</style>
