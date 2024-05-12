<!-- Script -->

<script lang="ts">
	import { tooltip } from '$scripts/tooltip';

	export let src: string;
	export let description: string = '';

	export let href: string | undefined = undefined;

	export let submit: boolean = false;
	export let disabled: boolean = false;
	export let scale: boolean = false;
	export let rotate: boolean = false;

	$: if (submit && href !== undefined) {
		console.warn("Button: submit type does not require a 'href' prop. Ignoring 'href' prop.");
		href = undefined;
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
		<img {src} alt="" />
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
		<img {src} alt="" />
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

		img
			filter: $purple-filter
			transform-origin: center
			pointer-events: none

		&.disabled
			pointer-events: none

			img
				filter: $gray-filter

		&:hover, &:focus
			img
				filter: $dark-purple-filter
			&.scale img
				scale: $scale-on-hover
			&.rotate img
				rotate: $rotate-on-hover

</style>
