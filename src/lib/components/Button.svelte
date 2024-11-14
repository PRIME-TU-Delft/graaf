
<script lang="ts">

	// Internal dependencies
	import { preventFocus } from '$scripts/actions/hocusfocus'

	// Exports
	export let href: string | undefined = undefined
	export let submit: boolean = false
	export let disabled: boolean = false
	export let dangerous: boolean = false

	// Variables
	let button: HTMLButtonElement | HTMLAnchorElement

	// Property validation
	$: if (submit && href !== undefined) {
		href = undefined
	}

</script>


<!-- Markup -->


{#if href === undefined}

	<button
		tabindex="-1"
		class="button"
		class:disabled
		class:dangerous
		disabled={disabled}
		type={submit ? 'submit' : 'button'}
		bind:this={button}
		use:preventFocus
		on:click
	>
		<slot />
	</button>

{:else}

	<a
		href={href}
		tabindex="-1"
		class="button"
		class:disabled
		class:dangerous
		bind:this={button}
		use:preventFocus
		on:click
	>
		<slot />
	</a>

{/if}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.button
		position: relative
		display: inline-flex
		flex-flow: row nowrap
		align-items: center

		padding: $input-thin-padding $input-thick-padding
		border-radius: $border-radius

		color: $white
		background: $purple
		white-space: nowrap

		cursor: pointer
		transition: all $default-transition

		&.dangerous
			background: $red
		
		&.disabled
			background: $gray
			pointer-events: none

		&:has(img)
			padding-left: $input-thin-padding

		:global(img)
			box-sizing: content-box
			width: $input-icon-size
			margin-right: $input-thin-padding

			filter: $white-filter
			transition: all $default-transition
			
		&:hover
			background: $dark-purple
			
			&.dangerous
				background: $dark-red

</style>
