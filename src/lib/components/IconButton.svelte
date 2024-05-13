
<script lang="ts">

	// Internal imports
	import { tooltip } from '$scripts/tooltip'

	// Exports1
	export let src: string
	export let description: string = ''
	export let href: string | undefined = undefined
	export let submit: boolean = false
	export let disabled: boolean = false
	export let scale: boolean = false
	export let rotate: boolean = false

	// Property validation
	$: if (submit && href !== undefined) {
		console.warn("Button: submit type does not require a 'href' prop. Ignoring 'href' prop.")
		href = undefined
	}

</script>



<!-- Markup -->



{#if href === undefined}

	<button
		type={submit ? 'submit' : 'button'}
		class="icon-button"
		class:disabled
		class:scale
		class:rotate
		use:tooltip={description}
		on:click
	>
		<img {src} alt="" class="icon" />
	</button>

{:else}

	<a
		{href}
		class="icon-button"
		class:disabled
		class:scale
		class:rotate
		use:tooltip={description}
		on:click
	>
		<img {src} alt="" class="icon" />
	</a>

{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.icon-button
		box-sizing: content-box
		width: $input-icon-size
		height: $input-icon-size
		padding: $input-icon-padding

		cursor: pointer

		.icon
			width: 100%
			height: 100%

			filter: $purple-filter
			transform-origin: center
			pointer-events: none

		&.disabled
			pointer-events: none

			.icon
				filter: $gray-filter

		&:hover, &:focus
			.icon
				filter: $dark-purple-filter
			&.scale .icon
				scale: $scale-on-hover
			&.rotate .icon
				rotate: $rotate-on-hover

</style>
