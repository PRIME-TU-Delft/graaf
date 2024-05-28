
<script lang="ts">

	// Internal imports
	import { clickoutside } from '$scripts/clickoutside'

	// Types
	type T = $$Generic

	// Exports
	export let label: string
	export let placeholder: string
	export let value: T | undefined = undefined
	export let options: { name: string, value: T, available: boolean, reason?: '' }[]

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
	<label for={id} class="label" class:grayed={value === undefined}>
		{options.find(option => option.value === value)?.name ?? placeholder}
	</label>

	<div class="options">
		{#each options as option}
			{#if option.available}
				<button class="option" on:click={() => value = option.value}> {option.name} </button>
			{:else}
				<button disabled class="option unavailable">
					<span class="name"> {option.name} </span>
					<span class="reason"> {option.reason} </span>
				</button>
			{/if}
		{/each}

		{#if options.length === 0}
			<button disabled class="option"> 
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

		.label
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
			overflow-y: auto

			background-color: $white
			border: 1px solid $gray
			border-width: 0 1px 1px 1px
			border-radius: 0 0 $border-radius $border-radius

			.option
				padding: $input-thin-padding $input-thick-padding
				text-align: left
				cursor: pointer

				&:last-child
					border-radius: 0 0 calc($border-radius - 1px) calc($border-radius - 1px)

				&:hover:not(:disabled)
					background-color: $light-gray
				
				&:disabled
					display: flex
					color: $placeholder-color
					cursor: not-allowed

					.name
						pointer-events: none

					.reason
						flex: 1
						color: $red
						text-align: right
						pointer-events: none

				


		&.visible
			.label
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
