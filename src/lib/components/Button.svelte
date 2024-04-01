
<!-- Script -->

<script lang="ts">

	export let callback: () => void = () => {};
	export let href: string | undefined = undefined;

	export let submit: boolean = false;
	export let disabled: boolean = false;
	export let rotate: boolean = false;
	export let scale: boolean = false;

	$: if (submit && href !== undefined) {
		console.warn("Button: submit and href are mutually exclusive");
	}

</script>

<!-- Markup -->

{#if href === undefined}

	<button
		class="button" class:disabled class:scale class:rotate
		type={submit ? "submit" : "button"}
		on:click={callback}
	>
		<slot />
	</button>

{:else}

	<a
		class="button" class:disabled class:scale class:rotate
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
			padding-right: $input-thin-padding

			filter: $white-filter
			transition: all $default-transition

		&:hover
			background: $dark-purple

			&.scale :global(img)
				scale: $scale-on-hover
			&.rotate :global(img)
				rotate: $rotate-on-hover

</style>