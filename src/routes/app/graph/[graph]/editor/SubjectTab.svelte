<script lang="ts">

	const SCROLL_ON_NEW = 55

	// Internal dependencies
	import { graph, subject_query } from './stores'

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

	// Variables
	$: filtered_subjects = $graph.subjects.filter(subject => subject.matchesQuery($subject_query))
	$: filtered_relations = $graph.subject_relations.filter(relation => relation.matchesQuery($subject_query))

</script>

<div class="subject-tab">

	<!-- Subjects -->
	{#if filtered_subjects.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<OrderedList let:item list={filtered_subjects}>
			<SubjectRow subject={item} />
		</OrderedList>
	{/if}

	<!-- New subject -->
	<button
		on:click={async () => {
			await SubjectController.create($graph.cache, $graph)
			$graph = $graph // Trigger reactivity
			setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
		}}
	> <img src={plus_icon} alt="New subject"> </button>

	<!-- Divider -->
	<div class="divider" id="relations">
		<div class="line" />
		<h3> Relations </h3>
		<div class="line" />
	</div>

	<!-- Subject Relations -->
	{#if filtered_subjects.length === 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<OrderedList let:item list={filtered_relations}>
			<RelationRow relation={item} />
		</OrderedList>
	{/if}

	<!-- New subject relation -->
	<button on:click={
		async () => {
			await SubjectRelationController.create($graph)
			$graph = $graph // Trigger reactivity
			setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
		}}
	> <img src={plus_icon} alt="New relation"> </button>
</div>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$left-gutter: $total-icon-size * 3 + $form-small-gap * 3
	$right-gutter: $total-icon-size + $form-small-gap

	.subject-tab
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap
		padding: 0 $card-thick-padding $card-thick-padding

		.grayed
			margin:
				right: $right-gutter
				bottom: $card-thick-padding
				left: $left-gutter

		.divider
			display: flex
			flex-flow: row nowrap
			align-items: center
			justify-content: center
			gap: $form-small-gap

			margin:
				top: $card-thick-padding
				right: $right-gutter
				bottom: $card-thick-padding
				left: $left-gutter

			color: $dark-gray

			.line
				flex-grow: 1
				border-top: 1px dashed $dark-gray

		button
			display: flex
			align-items: center
			justify-content: center

			width: calc( 100% - $left-gutter - $right-gutter )
			padding: $input-thin-padding $input-thick-padding
			margin:
				top: 0
				right: $right-gutter
				bottom: 0
				left: $left-gutter

			border: 1px solid $gray
			border-radius: $border-radius
			cursor: pointer

			&:hover
				background-color: $light-gray

			img
				width: $input-icon-size
				filter: $dark-gray-filter

</style>