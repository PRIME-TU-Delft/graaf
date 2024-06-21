
<script lang="ts">

	// Exports
	export let href: string | undefined = undefined
	export let submit: boolean = false
	export let disabled: boolean = false

	// Property validation
	$: if (submit && href !== undefined) {
		console.warn("LinkButton: submit type does not require a 'href' prop. Ignoring 'href' prop.")
		href = undefined
	}

</script>


<!-- Markup -->


{#if href === undefined}

	<button
		type={submit ? 'submit' : 'button'}
		class="link-button"
		class:disabled
		on:click
	>
		<slot />
	</button>

{:else}

	<a 
		{href}
		class="link-button" 
		class:disabled  
		on:click
	>
		<slot />
	</a>

{/if}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-button
		display: inline-flex
		flex-flow: row nowrap
		place-items: center start

		padding: $input-thin-padding

		color: $purple
		border: 1px solid transparent

		cursor: pointer
		transition: all $default-transition

		&.disabled
			color: $gray
			pointer-events: none

			:global(img)
				filter: $gray-filter

		:global(img)
			box-sizing: content-box
			width: $input-icon-size
			margin-right: $input-thin-padding

			filter: $purple-filter
			transform-origin: center
			transition: all $default-transition

		&:hover, &:focus
			color: $dark-purple
			text-decoration: underline

			:global(img)
				filter: $dark-purple-filter

</style>
