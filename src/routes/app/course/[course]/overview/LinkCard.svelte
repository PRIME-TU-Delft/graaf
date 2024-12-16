<script lang="ts">
	// Internal dependencies
	import { course } from './stores';
	import { LinkController } from '$scripts/controllers';

	// Components
	import LinkRow from './LinkRow.svelte';

	import Searchbar from '$components/Searchbar.svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';

	// Assets
	import plus_icon from '$assets/plus-icon.svg';

	// Main
	let link_query = $state('');
	const filtered_links = $derived($course.links.filter((link) => link.matchesQuery(link_query)));
</script>

<!-- Markup -->

<Card>
	{#snippet header()}
		<h3>Links</h3>

		<div class="flex-spacer"></div>
		<Searchbar placeholder="Search links" bind:value={link_query} />
		<Button
			onclick={async () => {
				await LinkController.create($course.cache, $course);
				$course = $course; // Trigger reactivity
			}}
		>
			<img src={plus_icon} alt="" /> New Link
		</Button>
	{/snippet}

	{#if filtered_links.length === 0}
		<p class="grayed">There's nothing here</p>
	{:else}
		<div class="header">
			<h4 style="grid-area: name">Name</h4>
			<h4 style="grid-area: graph">Graph</h4>
			<h4 style="grid-area: url">URL</h4>
		</div>

		{#each filtered_links as link}
			<LinkRow {link} />
		{/each}
	{/if}
</Card>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.header
		display: grid
		grid-template: ". . name graph url ." auto / $total-icon-size $total-icon-size 3fr 3fr 2fr 62px
		grid-gap: $form-small-gap

		padding:
			top: $input-thin-padding
			right: calc($input-thick-padding + $total-icon-size + $form-small-gap)
			left: $input-thick-padding

		color: $dark-gray

</style>
