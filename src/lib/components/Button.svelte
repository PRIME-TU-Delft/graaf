
<script lang="ts">

	// Exports
	export let href: string | undefined = undefined
	export let submit: boolean = false
	export let disabled: boolean = false
	export let dangerous: boolean = false

	// Variables
	let button: HTMLButtonElement | HTMLAnchorElement

</script>

<!-- Markup -->

{#if href === undefined}

	<button
		class="button"
		class:disabled
		class:dangerous
		disabled={ disabled }
		type={ submit ? 'submit' : 'button' }
		bind:this={ button }
		on:click
	>
		<slot />
	</button>

{:else}

	<a
		href={ disabled ? '' : href}
		class="button"
		class:disabled
		class:dangerous
		bind:this={button}
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

		padding: calc($input-thin-padding + 1px) calc($input-thick-padding + 1px)
		border-radius: $default-border-radius

		color: $white
		background: $purple

		cursor: pointer
		white-space: nowrap
		transition: all $default-transition, outline 0s

		// Prevent pointer events on children
		& > :global(*)
			pointer-events: none

		// Styling options
		&.dangerous
			background: $red

		&.disabled
			background: $gray
			pointer-events: none

		// Icon support
		&:has(img)
			padding-left: $input-thin-padding

		:global(img)
			box-sizing: content-box
			width: $input-icon-size
			margin-right: $input-thin-padding

			filter: $white-filter
		
		// User interaction
		&:focus-visible:not(:hover)
			outline: 2px solid $tudelft-blue

		&:hover
			box-shadow: 3px 3px 3px 0px rgba(0,0,0,0.2)
		
		&:active
			translate: 2px 2px
			box-shadow: 1px 1px 3px 0px rgba(0,0,0,0.2)
			background: $dark-purple

			&.dangerous
				background: $dark-red

</style>
