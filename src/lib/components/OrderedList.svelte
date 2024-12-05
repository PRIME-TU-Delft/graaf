
<script lang="ts">

	// External dependencies
	import { flip } from 'svelte/animate'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import type { Validation } from '$scripts/validation'

	// Components
	import Feedback from '$components/Feedback.svelte'

	// Variables
	export let list: T[] & { uuid: string, validate: (strict: boolean) => Validation }[]
	type T = $$Generic

</script>

<div class="list">
	{#each list as item, index (item.uuid)}
		<div class="row" animate:flip={{ duration: settings.UNIVERSAL_FADE_DURATION }}>

			<!-- Validation -->
			<Feedback compact data={item.validate(false)} />

			<!-- Item Index -->
			{index + 1}
			
			<!-- Item Content -->
			<slot {item} />
		</div>
	{/each}
</div>

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

			width: 100%

</style>