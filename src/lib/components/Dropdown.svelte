
<script lang="ts">

	// External imports
	import { createEventDispatcher } from 'svelte'

	// Internal imports
	import { DropdownOption } from '$scripts/entities/DropdownOption'
	import { clickoutside } from '$scripts/clickoutside'

	// Components
	import Validation from '$components/Validation.svelte'

	// Types
	type T = $$Generic

	// Exports
	export let label: string
	export let placeholder: string
	export let value: T | undefined = undefined
	export let options: DropdownOption<T>[]

	// Variables
	const dispatch = createEventDispatcher()
	const id = label.toLowerCase().replace(/\s/g, '_')

	let visible: boolean = false

	// Unset value if value not in options
	$: choice = options.find(option => option.value === value)
	$: set(choice?.value)

	// Sort options so errors are at the bottom
	$: options = options.sort((a, b) => {
		if (a.validation.severity === 'error') return 1
		if (b.validation.severity === 'error') return -1
		return 0
	})

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

	function set(next?: T) {
		if (next === value)
			return
		value = next
		dispatch('input', next)
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

	<div class="options">
		{#each options as option}
			<button
				type="button"
				class="option"
				disabled={option.validation.severity === 'error'}
				on:click={() => { set(option.value) }}
			>
				{option.name}
				<div class="flex-spacer" />
				<Validation short data={option.validation} />
			</button>
		{/each}

		{#if options.length === 0}
			<button type="button" disabled class="option grayed">
				<i> No options available </i>
			</button>
		{/if}

		{#if value !== undefined}
			<button type="button" class="option grayed" on:click={() => { set(undefined) }}>
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

		.header
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
			max-height: $max-dropdown-height
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
