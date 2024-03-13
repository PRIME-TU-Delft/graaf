
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
		class="link-btn" class:disabled class:scale class:rotate
		on:click={callback}
	>
		<slot />
	</button>

{:else}

	<a
		class="link-btn" class:disabled class:scale class:rotate
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

	.link-btn
		position: relative
		padding: $input-thin-padding $input-thick-padding

		color: $purple

		cursor: pointer
		transition: all $default-transition

		&.disabled
			color: $gray
			pointer-events: none

			:global(img)
				filter: $gray-filter

		&:has(img)
			padding-left: $input-icon-width

		:global(img)
			position: absolute
			translate: 0 -50%
			top: 50%
			left: $input-thin-padding

			width: $input-icon-size

			filter: $purple-filter
			transition: all $default-transition

		&:hover
			color: $dark-purple
			text-decoration: underline

			:global(img)
				filter: $dark-purple-filter
			&.scale :global(img)
				scale: $scale-on-hover
			&.rotate :global(img)
				rotate: $rotate-on-hover

</style>