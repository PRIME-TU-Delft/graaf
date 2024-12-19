<script lang="ts">

	const SCROLL_ON_NEW = 60

	// Internal dependencies
	import { graph, save_status, subject_query } from './stores'

	import {
		SubjectController,
		SubjectRelationController
	} from '$scripts/controllers'

	// Components
	import SubjectRow from './SubjectRow.svelte'
	import RelationRow from './RelationRow.svelte'

	import OrderedList from '$components/OrderedList.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'
	import { handleError } from '$scripts/utility';

	// Variables
	$: filtered_subjects = $graph.subjects.filter(subject => subject.matchesQuery($subject_query))
	$: filtered_relations = $graph.subject_relations.filter(relation => relation.matchesQuery($subject_query))

</script>

<!-- Markdown -->

<div class="tab">

	<!-- Subjects -->
	{#if filtered_subjects.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<div class="subject-row list-header">
			<h4 style="grid-area: name"> Name </h4>
			<h4 style="grid-area: style"> Style </h4>
		</div>

		<OrderedList let:item list={filtered_subjects}>
			<SubjectRow subject={item} />
		</OrderedList>
	{/if}

	<!-- New subject -->
	<button
		class="row-button"
		on:click={async () => {
			try {
				await SubjectController.create($graph.cache, $graph, $save_status)
				$graph = $graph // Trigger reactivity
				setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
			} catch (error) {
				handleError(error, $save_status)
			}
		}}
	> <img src={plus_icon} alt="New subject"> </button>

	<!-- Divider -->
	<div class="divider" id="scroll-divider">
		<div class="line" />
		<h3> Relations </h3>
		<div class="line" />
	</div>

	<!-- Subject Relations -->
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

	<!-- New subject relation -->
	<button 
		class="row-button"
		on:click={async () => {
			try {
				await SubjectRelationController.create($graph)
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