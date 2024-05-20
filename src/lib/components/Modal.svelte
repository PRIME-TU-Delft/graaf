
<script lang="ts">

	// Internal imports
	import { clickoutside } from '$scripts/clickoutside'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'

	// Exports
	export function show() {
		visible = true
	}
	export function hide() {
		visible = false
	}

	// Variables
	let visible: boolean = false

</script>



<!-- Markup -->



<!-- TODO: Replace with shadcn-svelte dialog: https://www.shadcn-svelte.com/docs/components/alert-dialog -->
{#if visible}
	<div class="background" />
	<dialog class="modal" use:clickoutside={hide}>
		<header>
			<slot name="header"> Modal </slot>
			<button class="exit" on:click={hide}>
				<img src={plusIcon} alt="Exit icon" class="icon" />
			</button>
		</header>
		<section>
			<slot />
		</section>
	</dialog>
{/if}



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.background
		position: fixed
		z-index: 999
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		background-color: rgba(0, 0, 0, 0.25)

	.modal
		display: flex
		flex-flow: column nowrap
		gap: 1rem

		position: fixed
		translate: -50% -50%
		z-index: 1000
		top: 50%
		left: 50%

		width: 100%
		max-width: $small-column
		padding: $card-thick-padding

		background-color: $white
		border-radius: $border-radius

		.exit
			display: flex
			align-items: center
			justify-content: center

			position: absolute
			top: 0
			right: 0

			margin: $card-thick-padding
			overflow: hidden

			.icon
				width: $input-icon-size
				rotate: 45deg

				cursor: pointer
				filter: $purple-filter

				&:hover
					scale: $scale-on-hover
					filter: $dark-purple-filter

</style>
