
<script lang="ts">

	// Exports
	export let href: string | undefined = undefined
	export let submit: boolean = false
	export let disabled: boolean = false
	export let dangerous: boolean = false

	// Property validation
	$: if (submit && href !== undefined) {
		console.warn("Button: submit type does not require a 'href' prop. Ignoring 'href' prop.")
		href = undefined
	}

</script>


<!-- Markup -->


{#if href === undefined}

	<button
		class="button"
		class:disabled
		class:dangerous
		type={submit ? 'submit' : 'button'}
		on:click
	>
		<slot />
	</button>

{:else}

	<a
		href={href}
		class="button"
		class:disabled
		class:dangerous
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
		display: inline-flex
		flex-flow: row nowrap
		align-items: center

		padding: $input-thin-padding $input-thick-padding

		border: 1px solid transparent
		border-radius: $border-radius

		color: $white
		background: $purple

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
			transform-origin: center
			transition: all $default-transition

		&:hover, &:focus
			background: $dark-purple
			
			&.dangerous
				background: $dark-red

</style>
