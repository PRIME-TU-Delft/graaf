<script lang="ts">
	import type { Snippet } from 'svelte';

	// Internal dependencies
	import { focusFirstChild, loopFocus } from '$scripts/actions/hocusfocus';
	import { Severity } from '$scripts/validation';

	import type { AbstractFormModal } from '$scripts/modals.svelte';

	// Components
	import Button from '$components/Button.svelte';
	import Feedback from '$components/Feedback.svelte';

	// Props
	type Props = {
		controller: AbstractFormModal;
		children: Snippet;
		header?: Snippet;
		form?: Snippet;
		submit?: Snippet;
	};

	let { controller, children, header, form, submit }: Props = $props();

	// Functions
	async function onkeydown(event: KeyboardEvent) {
		if (!open) return;

		if (event.key === 'Escape') {
			hide();
		} else if (event.key === 'Enter') {
			await submitForm();
		}
	}

	async function submitForm() {
		controller.touchAll();
		if (controller.validate().severity === Severity.error) {
			controller = controller;
			return;
		}

		submitting = true;
		await controller.submit();
		submitting = false;
		if (controller.close_on_submit) hide();
	}

	function show() {
		open = true;
	}

	function hide() {
		open = false;
		controller.reset();
	}

	// Main

	controller.show = show;
	controller.hide = hide;

	let submitting: boolean = $state(false);
	let open: boolean = $state(false);
</script>

<!-- Markup -->

<svelte:window onkeydown={async (event) => await onkeydown(event)} />

{#if open}
	<dialog use:loopFocus>
		<div class="header">
			<!-- <button class="exit" onclick={hide} /> TODO: this does nothing -->
			{@render header?.()}
		</div>

		{@render children()}

		<form use:focusFirstChild>
			{@render form?.()}

			<div class="footer">
				<Button
					onclick={async () => await submitForm()}
					disabled={submitting || controller.validate().severity === Severity.error}
				>
					{@render submit?.()}
				</Button>
				<Feedback data={controller.validate()} />
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

				border-left: 2px solid $dark-gray
				transition: height $default-transition

			&::after
				rotate: -45deg

</style>
