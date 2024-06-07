
<script lang="ts">

	// Internal imports
	import { clickoutside } from '$scripts/clickoutside'

	// Assets
	import warningIcon from '$assets/warning-icon.svg'
	import errorIcon from '$assets/error-icon.svg'

	// Types
	type T = $$Generic

	// Exports
	export let label: string
	export let placeholder: string
	export let value: T | undefined = undefined
	export let options: { name: string, value: T, warning?: string, error?: string }[]

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

	// Variables
	let visible: boolean = false
	$: id = label.toLowerCase().replace(/\s/g, '_')

	// Sort options by availability
	$: options = options.sort((a, b) =>
		(a.error !== undefined && b.error === undefined) ?  1 :
		(a.error === undefined && b.error !== undefined) ? -1 : 
		0
	)

	// Property validation
	$: if (options.find(option => option.value === value) === undefined) {
		value = undefined // If the current value isnt in the available options, default to undefined
	}

</script>



<!-- Markup -->



<button
	class="dropdown"
	class:visible
	on:click={toggle}
	use:clickoutside={hide}
>
	<!-- Hidden input to bind the selected value to a submittable element -->
	<input {id} name={id} type="hidden" tabindex="-1" bind:value />
	<label for={id} class="chosen" class:grayed={value === undefined}>
		{options.find(option => option.value === value)?.name ?? placeholder}
	</label>

	<div class="options">
		{#each options as option}
			<button
				class="option"
				disabled={option.error !== undefined}
				on:click={() => value = option.value}
			>
				{option.name}

				{#if option.error}
					<span class="error">
						<img class="icon" src={errorIcon} alt="" />
						{option.error}
					</span>
				{:else if option.warning}
					<span class="warning">
						<img class="icon" src={warningIcon} alt="" />
						{option.warning}
					</span>
				{/if}
			</button>
		{/each}

		{#if options.length === 0}
			<button disabled class="option grayed">
				<i> No options available </i>
			</button>
		{/if}

		{#if value !== undefined}
			<button class="option grayed" on:click={() => value = undefined}>
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

		color: $dark-gray

		.chosen
			position: relative
			width: 100%

			padding: $input-thin-padding $input-thick-padding

			border: 1px solid $gray
			border-radius: $border-radius
			background-color: $white
			text-align: left
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
			max-height: 250px
			overflow-y: scroll

			background-color: $white
			border: 1px solid $gray
			border-width: 0 1px 1px 1px
			border-radius: 0 0 $border-radius $border-radius

			.option
				display: flex


				padding: $input-thin-padding $input-thick-padding
				text-align: left
				cursor: pointer

				&:hover:not(:disabled)
					background-color: $light-gray

				&:disabled
					cursor: not-allowed
					color: $placeholder-color

				.warning, .error
					display: flex
					align-items: center
					justify-content: end
					gap: $input-thin-padding
					flex: 1

					pointer-events: none
					color: $yellow

					.icon
						width: $input-icon-size
						height: $input-icon-size
						filter: $yellow-filter

				.error
					color: $red

					.icon
						filter: $red-filter

		&.visible
			.chosen
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
