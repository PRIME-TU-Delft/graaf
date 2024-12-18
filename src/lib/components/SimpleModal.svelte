<script lang="ts">
	// Internal dependencies
	import { loopFocus, focusLastChild } from '$scripts/actions/hocusfocus';
	interface Props {
		header?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let { header, children, footer }: Props = $props();

	// Functions
	function onkeydown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape') {
			hide();
		}
	}

	// Main
	export const show = () => (open = true);
	export const hide = () => (open = false);

	let open: boolean = $state(false);
</script>

<!-- Markup -->

<svelte:window {onkeydown} />

{#if open}
	<div class="backdrop"></div>
	<dialog use:loopFocus use:focusLastChild>
		<div class="header">
			<!-- <button class="exit" onclick={hide}></button> TODO: this does nothing -->
			{@render header?.()}
		</div>

		{@render children?.()}

		<div class="footer">
			{@render footer?.()}
		</div>
	</dialog>
{/if}

<!-- Styles -->

<style lang="sass">

	@use 'sass:math'
	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.backdrop
		position: fixed
		z-index: 3
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		background-color: rgba($black, 0.25)

	dialog
		position: fixed
		translate: -50% -50%
		z-index: 4
		top: 50%
		left: 50%

		display: flex
		flex-flow: column nowrap

		width: calc(100% - 2 * $tudelft-logo-width)
		max-width: $small-column
		padding: $card-thick-padding

		background-color: $white
		border-radius: $default-border-radius
		box-shadow: $default-box-shadow

		.header
			display: flex
			flex-flow: row nowrap
			justify-content: flex-start
			align-items: center
			gap: $form-small-gap

			width: 100%
			margin-bottom: $form-medium-gap

		.footer
			display: flex
			flex-flow: row nowrap
			justify-content: flex-end
			align-items: center
			gap: $form-medium-gap

			width: 100%
			margin-top: $form-big-gap

		.exit
			position: absolute
			top: $card-thick-padding
			right: $card-thick-padding

			box-sizing: content-box
			width: $input-icon-size
			height: $input-icon-size
			padding: $input-icon-padding

			border-radius: $default-border-radius

			cursor: pointer

			&:focus-visible
				outline: $default-outline

			&:hover::before, &:hover::after
				height: $input-icon-size * math.sqrt(2)

			&::before, &::after
				content: ''

				position: absolute
				translate: -50% -50%
				rotate: 45deg
				left: 50%
				top: 50%

				height: $input-icon-size

				pointer-events: none
				border-left: 2px solid $dark-gray
				transition: height $default-transition

			&::after
				rotate: -45deg

</style>
