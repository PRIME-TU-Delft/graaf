
<script lang="ts">

	// Internal imports
	import { ValidationData, Severity } from '$scripts/entities'
	import { clickoutside } from '$scripts/clickoutside'

	// Assets
	import errorIcon from '$assets/error-icon.svg'
	import warningIcon from '$assets/warning-icon.svg'

	// Types
	type T = $$Generic
	type Option = {
		name: string
		value: T
		validation: ValidationData
	}

	// Exports
	export let label: string
	export let placeholder: string
	export let value: T | undefined = undefined
	export let options: Option[]

	// Variables
	let dropdown: HTMLElement
	let visible: boolean = false

	$: id = label.toLowerCase().replace(/\s/g, '_')
	$: choice = options.find(option => option.value === value)
	$: options = options.sort((a, b) => {
		if (a.validation.severity === Severity.error) return 1
		if (b.validation.severity === Severity.error) return -1
		return 0
	})

	// Scroll down so the entire dropdown is visible
	$: if (visible) {
		setTimeout(() => { // Wait for the DOM to update
			const rect = dropdown.getBoundingClientRect()
			if (rect.bottom > window.innerHeight) {
				dropdown.scrollIntoView(false)
			}
		}, 0)
	}

	// Functions
	export function show() {
		visible = true
	}

	export function hide() {
		visible = false
	}

	export function toggle() {
		visible = !visible
	}

</script>


<!-- Markup -->


<button
	type="button"
	class="dropdown"
	class:visible
	tabindex="-1"
	on:click={toggle}
	use:clickoutside={hide}
>
	<!-- Hidden input to bind the selected value to a submittable element -->
	<input id={id} name={id} type="hidden" bind:value />
	<label for={id} class="header" class:grayed={!choice}>
		{choice?.name || placeholder}
	</label>

	<div class="options" bind:this={dropdown}>
		{#each options as option}
			<button
				type="button"
				class="option"
				disabled={option.validation.severity === Severity.error}
				on:click={() => value = option.value}
			>
				{option.name}
				
				{#if option.validation.severity === Severity.error}
					<span class="error">
						<img src={errorIcon} alt="" /> {option.validation.errors[0].short}
					</span>
				{:else if option.validation.severity === Severity.warning}
					<span class="warning">
						<img src={warningIcon} alt="" /> {option.validation.warnings[0].short}
					</span>
				{/if}

				</button>
			{/each}

		{#if options.length === 0}
			<button type="button" disabled class="option grayed">
				<i> No options available </i>
			</button>
		{/if}

		{#if value !== undefined}
			<button type="button" class="option grayed" on:click={() => value = undefined}>
				<i> Remove choice </i>
			</button>
		{/if}
	</div>
</button>


<!-- Styles -->


<style lang="sass">

	@use '$styles/variables.sass' as *
	@use '$styles/palette.sass' as *

	$caret-size: calc($input-icon-size / sqrt(2))

	.dropdown
		display: flex
		flex-flow: column nowrap

		position: relative
		width: 100%

		overflow-x: hidden
		color: $dark-gray

		.header
			position: relative

			padding: $input-thin-padding $input-thick-padding
			padding-right: $input-thick-padding * 2 + $caret-size

			border: 1px solid $gray
			border-radius: $border-radius
			background-color: $white

			text-align: left
			text-overflow: ellipsis
			white-space: nowrap
			overflow: hidden
			
			cursor: pointer

			&::after
				content: ""

				position: absolute
				translate: 0 15%
				rotate: 45deg
				right: $input-thick-padding
				bottom: 50%

				box-sizing: border-box
				width: $caret-size
				height: $caret-size

				border: 1px solid $black
				border-width: 0 1px 1px 0

		.options
			display: none
			flex-flow: column nowrap

			position: absolute
			z-index: 1
			top: 100%

			width: 100%
			max-height: $max-dropdown-height
			overflow-y: scroll

			background-color: $white
			border: 1px solid $gray
			border-width: 0 1px 1px 1px
			border-radius: 0 0 $border-radius $border-radius

			.option
				display: grid
				grid-template: "option validation" auto / 1fr auto
				column-gap: $input-thick-padding

				padding: $input-thin-padding $input-thick-padding

				text-align: left
				cursor: pointer

				&:hover
					background-color: $light-gray

				&:disabled
					cursor: not-allowed
					color: $placeholder-color

				.error, .warning
					display: flex
					align-items: center
					justify-content: end
					gap: $form-small-gap

					pointer-events: none
					color: $red
					flex: 1

					img
						width: $input-icon-size
						height: $input-icon-size
						filter: $red-filter
				
				.warning
					color: $yellow
					
					img
						filter: $yellow-filter


		&.visible
			.header
				border-bottom-style: dashed
				border-radius: $border-radius $border-radius 0 0

				&::after
					translate: 0 80%
					rotate: -135deg

			.options
				display: flex

		.grayed
			color: $placeholder-color

</style>
