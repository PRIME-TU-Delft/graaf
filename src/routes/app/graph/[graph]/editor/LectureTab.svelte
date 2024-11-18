<script lang="ts">

    const SCROLL_ON_NEW = 55

	// Internal dependencies
	import { graph, lecture_query } from './stores'
	import { LectureController } from '$scripts/controllers'

	// Components
    import LectureRow from './LectureRow.svelte'

	import SortableList from '$components/SortableList.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

    // Variables
    $: filtered_lectures = $graph.lectures.filter(lecture => lecture.matchesQuery($lecture_query))

</script>

<div class="lecture-tab">

	<!-- Domains -->
	{#if filtered_lectures.length == 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<SortableList let:item list={filtered_lectures} >
			<LectureRow lecture={item} />
		</SortableList>
	{/if}

	<!-- New domain -->
	<button
		on:click={async () => {
			await LectureController.create($graph.cache, $graph)
			$graph = $graph // Trigger reactivity
			setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
		}}
	> <img src={plus_icon} alt="New domain"> </button>

</div>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$left-gutter: $total-icon-size * 3 + $form-small-gap * 3
	$right-gutter: $total-icon-size + $form-small-gap

	.lecture-tab
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap
		padding: 0 $card-thick-padding $card-thick-padding

		.grayed
			margin:
				right: $right-gutter
				bottom: $card-thick-padding
				left: $left-gutter

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