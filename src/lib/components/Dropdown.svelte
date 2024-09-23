
<script lang="ts">

	// Svelte imports
	import { createEventDispatcher } from "svelte"

	// Internal imports
	import { ValidationData, Severity } from '$scripts/entities'
	import { clickoutside } from '$scripts/clickoutside'
	import { scrollintoview } from '$scripts/scrollintoview'
	import { focusfirst, focusonhover, losefocus } from '$scripts/hocusfocus'

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

	// Functions
	function visibility(value: boolean) {

		// Manually set the height of the wrapper, as options are positioned absolutely
		setTimeout(() => wrapper.style.height = value ? wrapper.scrollHeight + 'px' : 'auto', 0)
		visible = value
	}

	function set(new_value?: T) {
		value = new_value
		dispatch('change', new_value)
	}

	// Variables
	const dispatch = createEventDispatcher()
	let visible: boolean = false
	let wrapper: HTMLDivElement

	$: id = label.toLowerCase().replace(/\s/g, '_')
	$: choice = options.find(option => option.value === value)
	$: options = options.sort((a, b) => {
		if (a.validation.severity === Severity.error) return 1
		if (b.validation.severity === Severity.error) return -1
		return 0
	})

</script>


<!-- Markup -->


<div class="dropdown">
	you shouldn't see this
	<div class="wrapper" use:losefocus={() => visibility(false)} bind:this={wrapper}>
		<!-- Hidden input to bind the selected value to a submittable element -->
		<input id={id} name={id} type="hidden" tabindex="-1" bind:value />
		<button
			class="header"
			class:visible
			class:grayed={!choice}
			on:click={() => visibility(!visible)}
			use:clickoutside={() => visibility(false)}
		>
			{choice?.name || placeholder}
		</button>

		{#if visible}
			<div class="options" use:focusfirst use:scrollintoview>
				{#each options as option}
					<button
						type="button"
						class="option"
						disabled={option.validation.severity === Severity.error}
						on:click={() => set(option.value)}
						use:focusonhover
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
					<button type="button" class="option grayed" on:click={() => set()} use:focusonhover>
						<i> Remove choice </i>
					</button>
				{/if}
			</div>
		{/if}
	</div>
</div>


<!-- Styles -->


<style lang="sass">

	@use '$styles/variables.sass' as *
	@use '$styles/palette.sass' as *

	$caret-size: calc($input-icon-size / sqrt(2))

	.grayed
		color: $placeholder-color

	.dropdown
		position: relative
		width: 100%

		padding: $input-thin-padding $input-thick-padding

		.wrapper
			position: absolute
			top: 0
			left: 0

			width: 100%
			overflow: hidden

			.header
				position: relative
				display: block

				width: 100%
				padding:
					top: $input-thin-padding
					right: $caret-size + 2 * $input-thick-padding
					bottom: $input-thin-padding
					left: $input-thick-padding


				overflow: hidden
				text-overflow: ellipsis
				white-space: nowrap

				border: 1px solid $gray
				border-radius: $border-radius
				background-color: $white
				text-align: left
				cursor: pointer

				&:focus
					border-color: $tudelft-blue

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

				&.visible
					border-color: $tudelft-blue
					border-bottom-color: $gray
					border-bottom-style: dashed
					border-radius: $border-radius $border-radius 0 0

					&::after
						translate: 0 80%
						rotate: -135deg

			.options
				position: absolute
				z-index: 1

				display: flex
				flex-flow: column nowrap

				width: 100%
				max-height: $max-dropdown-height
				overflow-y: auto

				border: 1px solid $tudelft-blue
				border-width: 0 1px 1px 1px
				border-radius: 0 0 $border-radius $border-radius
				background-color: $white

				.option
					display: flex
					flex-flow: row nowrap
					align-items: center

					padding: $input-thin-padding $input-thick-padding

					text-align: left
					cursor: pointer

					&:focus
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

			&.visible .header
				border-color: $tudelft-blue
				border-bottom-color: $gray
				border-bottom-style: dashed
				border-radius: $border-radius $border-radius 0 0

				&::after
					translate: 0 80%
					rotate: -135deg

</style>
