

<script lang="ts">

	// Internal imports
	import { focusFirstChild } from '$scripts/actions/hocusfocus'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'

	// Exports
	export function setHideCallback(callback: () => void) {
		hideCallback = callback
	}

	export function setShowCallback(callback: () => void) {
		showCallback = callback
	}

	export function show() {
		showCallback()
		visible = true
	}

	export function hide() {
		hideCallback()
		visible = false
	}

	// Variables
	let visible: boolean = false
	let modal: HTMLDialogElement
	let showCallback: () => void = () => {}
	let hideCallback: () => void = () => {}

</script>


<!-- Markup -->

{#if visible}
	<div class="background" />
	<dialog class="modal" bind:this={modal} >
		<header>
			<slot name="header" />
			<button class="exit" on:click={hide}>
				<img src={plusIcon} alt="Exit icon" class="icon" />
			</button>
		</header>
		<section use:focusFirstChild>
			<slot />
		</section>
		<footer>
			<slot name="footer" />
		</footer>
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

		opacity: 0.25
		background-color: black

	.modal
		position: fixed
		translate: -50% -50%
		z-index: 1000
		top: 50%
		left: 50%

		display: flex
		flex-flow: column nowrap
		gap: 1rem

		width: 100%
		max-width: $small-column
		padding: $card-thick-padding

		background-color: $white
		border-radius: $border-radius
		box-shadow: $shadow

		footer
			display: flex
			flex-flow: row nowrap
			justify-content: flex-end
			align-items: center
			gap: $form-medium-gap

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

			&:focus, .icon:hover
				scale: $scale-on-hover
				filter: $dark-purple-filter
		
	:global(.modal form)
		display: grid
		grid-template: "label content" auto / 1fr 2fr
		place-items: center start
		row-gap: $form-small-gap
		column-gap: $form-medium-gap

		margin-top: $form-big-gap

		:global(label)
			grid-column: label
			justify-self: end

		:global(.textfield), :global(.textarea), :global(.dropdown)
			grid-column: content

		:global(footer)
			display: flex
			flex-flow: row nowrap
			gap: $form-medium-gap
			grid-column: content

			width: 100%
			margin-top: $form-medium-gap


</style>
