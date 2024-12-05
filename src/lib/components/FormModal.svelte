
<script lang="ts">

	// Internal dependencies
	import { loopFocus, focusFirstChild } from '$scripts/actions/hocusfocus'
	import { Severity } from '$scripts/validation'

	import type { AbstractFormModal } from  '$scripts/modals'

	// Components
	import Button from '$components/Button.svelte'
	import Feedback from '$components/Feedback.svelte'

	// Functions
	async function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			hide()
		} else if (event.key === 'Enter') {
			await submit()
		}
	}

	async function submit() {
		controller.touchAll()
		if (controller.validate().severity === Severity.error) {
			controller = controller
			return
		}

		submitting = true
		await controller.submit()
		submitting = false
		hide()
	}

	function show() {
		open = true
	}

	function hide() {
		open = false
		controller.reset()
	}

	// Main
	export let controller: AbstractFormModal

	controller.show = show
	controller.hide = hide

	let submitting: boolean = false
	let open: boolean = false

</script>

<!-- Markup -->

<svelte:window on:keydown={ async event => await onkeydown(event) } />

{#if open}
	<div class="backdrop" />
	<dialog use:loopFocus>
		<div class="header">
			<button class="exit" on:click={ hide } />
			<slot name="header" />
		</div>

		<slot />

		<form use:focusFirstChild>
			<slot name="form" />

			<div class="footer">
				<Button
					on:click={ async () => await submit() }
					disabled={ submitting || controller.validate().severity === Severity.error }
				> <slot name="submit" /> </Button>
				<Feedback animate data={ controller.validate() } />
			</div>
		</form>
	</dialog>
{/if}

<!-- Styles -->

<style lang="sass">

	@use 'sass:math'
	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.backdrop
		position: fixed
		z-index: 999
		top: 0
		left: 0

		width: 100vw
		height: 100vh

		background-color: rgba($black, 0.25)

	dialog
		position: fixed
		translate: -50% -50%
		z-index: 1000
		top: 50%
		left: 50%

		display: flex
		flex-flow: column nowrap

		width: calc(100% - 2 * $tudelft-logo-width)
		max-width: $small-column
		padding: $card-thick-padding

		background-color: $white
		border-radius: $border-radius
		box-shadow: $shadow

		.header
			display: flex
			flex-flow: row nowrap
			justify-content: flex-start
			align-items: center
			gap: $form-small-gap

			width: 100%
			margin-bottom: $form-medium-gap

		form
			display: grid
			grid-template: "label input" auto / 2fr 3fr
			place-items: center end
			gap: $form-small-gap

			margin-top: $form-big-gap

			.footer
				display: flex
				flex-flow: row nowrap
				justify-content: flex-start
				align-items: center
				gap: $form-small-gap
				grid-column: input

				width: 100%
				margin-top: $form-medium-gap - $form-small-gap

		.exit
			position: absolute
			top: $card-thick-padding
			right: $card-thick-padding

			width: $input-icon-size
			height: $input-icon-size
			padding: $input-icon-padding
			box-sizing: content-box

			cursor: pointer
			caret-color: transparent !important

			&:focus-visible
				outline: 1px solid $tudelft-blue

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

				border-left: 2px solid $dark-gray
				transition: height $default-transition

			&::after
				rotate: -45deg

</style>