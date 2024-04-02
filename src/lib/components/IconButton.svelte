
<!-- Script -->

<script lang="ts">

	import { tooltip as tooltipAction } from '$scripts/tooltip';

	export let src: string;
	export let alt: string;
	export let tooltip: string = "";

	export let callback: () => void = () => {};
	export let href: undefined | string = undefined;

	export let disabled: boolean = false;
	export let scale: boolean = false;
	export let rotate: boolean = false;

</script>

<!-- Markup -->

{#if href === undefined}

	<button
		use:tooltipAction={tooltip}
		class="icon-button" class:disabled class:scale class:rotate
		on:click={callback}
	>
		<img src={src} alt="">
	</button>

{:else}

	<a
		class="icon-button" class:disabled class:scale class:rotate
		on:click={callback}
		href={href}
	>
		<img src={src} alt={alt}>
	</a>

{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.icon-button
		box-sizing: content-box
		height: $input-icon-size
		padding: $input-thin-padding

		cursor: pointer

		img
			width: $input-icon-size
			filter: $purple-filter
			pointer-events: none
		
		&.disabled
			pointer-events: none

			img
				filter: $gray-filter	

		&:hover
			img
				filter: $dark-purple-filter
			&.scale img
				scale: $scale-on-hover
			&.rotate img
				rotate: $rotate-on-hover

</style>