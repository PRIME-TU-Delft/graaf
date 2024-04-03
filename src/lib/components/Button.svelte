
<!-- Script -->

<script lang="ts">

	export let href: string | undefined = undefined;

	export let submit: boolean = false;
	export let disabled: boolean = false;
	export let rotate: boolean = false;
	export let scale: boolean = false;

	$: if (submit && href !== undefined) {
		console.warn("Button: submit type does not require a 'href' prop. Ignoring 'href' prop.");
		href = undefined;
	}

</script>

<!-- Markup -->

{#if href !== undefined}

	<a
		class="button" class:disabled class:scale class:rotate
		href={href}
		on:click
	>
		<slot />
	</a>

{:else}

	<button
		type={submit ? "submit" : "button"}
		class="button" class:disabled class:scale class:rotate
		on:click
	>
		<slot />
	</button>

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

		&:hover
			background: $dark-purple

			&.scale :global(img)
				scale: $scale-on-hover
			&.rotate :global(img)
				rotate: $rotate-on-hover

</style>