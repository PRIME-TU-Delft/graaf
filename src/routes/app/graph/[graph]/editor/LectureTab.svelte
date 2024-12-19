<script lang="ts">

    const SCROLL_ON_NEW = 60

	// Internal dependencies
	import { graph, lecture_query, save_status } from './stores'
	import { LectureController } from '$scripts/controllers'

	// Components
    import LectureRow from './LectureRow.svelte'

	import SortableList from '$components/SortableList.svelte'
	import Feedback from '$components/Feedback.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'
	import { handleError } from '$scripts/utility';

    // Main
    $: filtered_lectures = $graph.lectures.filter(lecture => lecture.matchesQuery($lecture_query))

</script>

<!-- Markdown -->

<div class="tab">

	<!-- Lectures -->
	{#if filtered_lectures.length == 0}
		<p class="grayed"> There's nothing here </p>
	{:else}
		<SortableList
			list={filtered_lectures} 
			on:rearrange={async event => {
				try {
					await $graph.reorderLectures(event.detail, $save_status)
					$graph = $graph // Trigger reactivity
				} catch (error) {
					handleError(error, $save_status)
				}
			}}
		>
			<svelte:fragment slot="left" let:item>
				<div class="feedback-alignment">
					<Feedback compact data={item.validate(false)} />
				</div>
			</svelte:fragment>

			<svelte:fragment slot="right" let:item>
				<LectureRow lecture={item} />
			</svelte:fragment>
		</SortableList>
	{/if}

	<!-- New lecture -->
	<button
		class="row-button"
		on:click={async () => {
			try {
				await LectureController.create($graph.cache, $graph, $save_status)
				$graph = $graph // Trigger reactivity
				setTimeout(() => scrollBy({top: SCROLL_ON_NEW, behavior: 'smooth'}), 0)
			} catch (error) {
				handleError(error, $save_status)
			}
		}}
	> <img src={plus_icon} alt="New lecture"> </button>

</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	@import "./styles.sass"

	.feedback-alignment
		align-self: stretch
		padding-top: calc( 0.75rem + $input-thin-padding + 1px - $total-icon-size * 0.5 )

</style>