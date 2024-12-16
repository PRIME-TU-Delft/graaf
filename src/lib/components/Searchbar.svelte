<script lang="ts">
	// Assets
	import search_icon from '$assets/search-icon.svg';

	interface Props {
		// Exports
		placeholder?: string;
		value?: string;
		oninput?: (event: Event) => void;
		onchange?: (event: Event) => void;
	}

	let {
		placeholder = '',
		value = $bindable(''),
		oninput = () => {},
		onchange = () => {}
	}: Props = $props();
</script>

<!-- Markup -->

<div class="search">
	<input type="text" {placeholder} bind:value {oninput} {onchange} />
	<img src={search_icon} alt="search-icon" />
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.search
		position: relative

		width: 100%
		max-width: 20rem

		input
			width: 100%
			padding: 
				top: $input-thin-padding 
				right: $input-icon-size + 1.3rem
				bottom: $input-thin-padding
				left: $input-thick-padding

			border: 1px solid $gray
			border-radius: $default-border-radius

			color: $dark-gray
			background-color: $white

			cursor: text

			&:focus
				outline: $default-outline
				border-color: $white

		img
			position: absolute
			translate: 0 -50%
			top: 50%
			right: 0.75rem

			width: $input-icon-size

			filter: $gray-filter
			pointer-events: none

</style>
