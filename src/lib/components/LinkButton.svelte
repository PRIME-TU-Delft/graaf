<script lang="ts">
	interface Props {
		// Exports
		href?: string | undefined;
		submit?: boolean;
		disabled?: boolean;
		onclick?: (event: MouseEvent) => void;
		children?: import('svelte').Snippet;
	}

	let {
		href = undefined,
		submit = false,
		disabled = false,
		onclick = () => {},
		children
	}: Props = $props();
</script>

<!-- Markup -->

{#if href === undefined}
	<button
		class="link-button"
		class:disabled
		{disabled}
		type={submit ? 'submit' : 'button'}
		{onclick}
	>
		{@render children?.()}
	</button>
{:else}
	<a href={disabled ? '' : href} class="link-button" class:disabled>
		{@render children?.()}
	</a>
{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-button
		position: relative
		display: inline-flex
		flex-flow: row nowrap

		padding: $input-thin-padding $input-thick-padding
		border-radius: $default-border-radius

		color: $purple

		cursor: pointer
		white-space: nowrap
		transition: all $default-transition, outline 0s

		// Prevent pointer events on children				
		& > :global(*)
			pointer-events: none

		// Styling options
		&.disabled
			color: $gray
			pointer-events: none

			:global(img)
				filter: $gray-filter

		// Icon support
		:global(img)
			box-sizing: content-box
			width: $input-icon-size
			margin-right: $input-thin-padding

			filter: $purple-filter
			transform-origin: center
			transition: all $default-transition

		// User interaction
		&:focus-visible
			outline: $default-outline

		&:hover
			color: $dark-purple
			text-decoration: underline

			:global(img)
				filter: $dark-purple-filter

</style>
