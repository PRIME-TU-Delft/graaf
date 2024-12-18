<script lang="ts" generics="T">
	// External dependencies
	import type { Snippet } from 'svelte';
	import { flip } from 'svelte/animate';
	// Internal dependencies
	import * as settings from '$scripts/settings';
	import type { Validation } from '$scripts/validation';
	// Components
	import Feedback from '$components/Feedback.svelte';

	type ListItem = T[] & { uuid: string; validate: (strict: boolean) => Validation };

	interface Props {
		// Variables
		list: ListItem[];
		children?: Snippet<[{ item: ListItem }]>;
	}

	let { list, children }: Props = $props();
</script>

<!-- Markdown -->

<div class="list">
	{#each list as item, index (item.uuid)}
		<div class="row" animate:flip={{ duration: settings.UNIVERSAL_FADE_DURATION }}>
			<!-- Validation -->
			<Feedback compact data={item.validate(false)} />

			<!-- Item Index -->
			{index + 1}

			<!-- Item Content -->
			{@render children?.({ item })}
		</div>
	{/each}
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.list
		display: flex
		flex-flow: column nowrap
		gap: $form-small-gap

		.row
			display: grid
			grid-template: "validate index content" auto / $total-icon-size $total-icon-size 1fr
			place-items: center center
			grid-gap: $form-small-gap

</style>
