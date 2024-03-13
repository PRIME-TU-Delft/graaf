
<!-- Script -->

<script lang="ts">

	export let callback: () => void = () => {};
	export let href: undefined | string = undefined;

	export let disabled: boolean = false;
	export let scale: boolean = false;
	export let rotate: boolean = false;

</script>

<!-- Markup -->

{#if href === undefined}

	<button
		class="default-btn" class:disabled class:scale class:rotate
		on:click={callback}
	>
		<slot />
	</button>

{:else}

	<a
		class="default-btn" class:disabled class:scale class:rotate
		on:click={callback}
		href={href}
	>
		<slot />
	</a>

{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.default-btn
		position: relative
		padding: $input-thin-padding $input-thick-padding

		border: 1px solid transparent
		border-radius: $border-radius

		color: $white
		background: $purple

		cursor: pointer
		transition: all $default-transition

		&.disabled
			background: $gray
			pointer-events: none

		&:has(img)
			padding-left: $input-icon-width

		:global(img)
			position: absolute
			translate: 0 -50%
			top: 50%
			left: $input-thin-padding

			width: $input-icon-size

			filter: $white-filter
			transition: all $default-transition

		&:hover
			background: $dark-purple

			&.scale :global(img)
				scale: $scale-on-hover
			&.rotate :global(img)
				rotate: $rotate-on-hover

</style>