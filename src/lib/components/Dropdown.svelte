
<script lang="ts">

	import { createEventDispatcher } from "svelte"

	import { Severity } from "$scripts/validation"
	import { loopFocus, focusOnLoad } from "$scripts/actions/hocusfocus"
	import { clickoutside } from "$scripts/actions/clickoutside"
	import type { DropdownOption } from "$scripts/types"

	import error_icon from "$assets/error-icon.svg"
	import warning_icon from "$assets/warning-icon.svg"
	import search_icon from "$assets/search-icon.svg"

	function onKeydown(event: KeyboardEvent) {
		if (!open) return

		if (event.key === 'Tab') {
			if (options.length === 0)
				setOpen(false)
			return
		}

		if (event.key === 'Escape') {
			setOpen(false)
			return
		}

		if (event.key === 'Enter' || event.key === 'Shift') {
			return
		}

		search.focus()
	}

	function setOpen(value: boolean) {
		if (!value) query = ''
		open = value
	}

	function setValue(new_value: T | null) {
		dispatch('change', new_value)
		value = new_value
		setOpen(false)
	}

	type T = $$Generic

	export let placeholder: string = 'Select an option'
	export let options: DropdownOption<T>[]
	export let value: T | null

	const dispatch = createEventDispatcher<{change: T | null}>()

	let search: HTMLDivElement
	let open: boolean = false
	let query: string = ''

	$: show_preview = options.some(option => option.color)
	$: selected = options.find(option => option.value === value) || null
	$: filtered_options = options
		.filter(option => option.label.toLowerCase().includes(query.toLowerCase()))
		.toSorted((a, b) => {
			if (a.validation?.severity === Severity.error) return 1
			if (b.validation?.severity === Severity.error) return -1
			return 0
		})

</script>

<!-- Markup -->

<svelte:window on:keydown={ onKeydown } />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->

<div class="dropdown">
	<div 
		class:open
		class="wrapper" 
		use:clickoutside={ () => setOpen(false) }
	>
		<button 
			class="header"
			class:grayed={ !selected }
			on:click={ () => setOpen(!open) }
		>
			{#if selected?.label}
				{ selected.label }
			{:else if selected}
				<i> Untitled option </i>
			{:else}
				{ placeholder }
			{/if}
		</button>

		{#if open}
			<div class="options" use:loopFocus={ filtered_options }>
				{#if options.length === 0}
					<button class="option" disabled>
						<i> No options available </i>
					</button>
				{:else}
					<div class="search">
						<input
							type="text"
							placeholder="Search"
							bind:value={ query }
							bind:this={ search }
							use:focusOnLoad
						/>

						<img src={ search_icon } alt="Search" />
					</div>

					{#each filtered_options as option}
						<button
							class="option"
							disabled={ option.validation?.severity === Severity.error }
							on:click={ () => setValue(option.value) }
						>
							{#if option.label}
								{ option.label }
							{:else}
								<i> Nameless option </i>
							{/if}

							{#if option.validation}
								{#if option.validation.severity === Severity.error}
									<div class="error">
										{ option.validation.errors[0].short }
										<img src={ error_icon } alt="Error" />
									</div>
								{:else if option.validation.severity === Severity.warning}
									<div class="warning">
										{ option.validation.warnings[0].short }
										<img src={ warning_icon } alt="Warning" />
									</div>
								{/if}
							{/if}

							{#if show_preview}
								<div
									class="preview"
									style:grid-area="preview"
									style:background={ option.color }
								/>
							{/if}
						</button>
					{/each}

					{#if selected !== null}
						<button
							class="option"
							on:click={ () => setValue(null) }>
							<i> Remove choice </i>
						</button>
					{:else if filtered_options.length === 0}
						<button disabled class="option">
							<i> No results found </i>
						</button>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use '$styles/variables.sass' as *
	@use '$styles/palette.sass' as *
	@use 'sass:math'

	.dropdown
		position: relative
		
		width: 100%
		min-width: 3 * $input-thick-padding + $input-icon-size
		height: calc( 1.5rem + 2 * $input-thin-padding + 2px )

		.wrapper
			position: absolute
			top: 0
			left: 0

			width: 100%

			border-radius: $default-border-radius
			border: 1px solid $gray

			background: $white

			&:focus-within
				outline: $default-outline
				border-color: $white

				.header, .search, .option
					border-color: $white
				&.open .header
					border-bottom-color: $gray

			&.open 
				z-index: 1
				
				.header
					border-bottom: 1px dashed $gray
					border-radius: $default-border-radius $default-border-radius 0 0

					&::after
						translate: 0 50%
						rotate: -135deg

			.header
				width: 100%
				padding:
					top: $input-thin-padding
					right: 2 * $input-thick-padding + $input-icon-size
					bottom: $input-thin-padding
					left: $input-thick-padding

				overflow: hidden
				white-space: nowrap
				text-overflow: ellipsis
				text-align: left

				border-radius: $default-border-radius

				.grayed
					color: $placeholder-color

				&::after
					content: ''

					position: absolute
					rotate: 45deg
					top: $input-thin-padding + math.div((2 - math.sqrt(2)) * $input-icon-size, 4)
					right: $input-thick-padding + math.div((2 - math.sqrt(2)) * $input-icon-size, 4)

					width: math.div($input-icon-size, math.sqrt(2))
					height: math.div($input-icon-size, math.sqrt(2))

					border-width: 0 2px 2px 0
					border-style: solid
					border-color: $dark-gray

			.options
				width: 100%
				max-height: 15rem
				overflow: auto

				.search
					position: relative

					input
						width: 100%
						padding:
							top: $input-thin-padding
							right: 2 * $input-thick-padding + $input-icon-size
							bottom: $input-thin-padding
							left: $input-thick-padding

						cursor: text

					img
						position: absolute
						translate: 0 -50%
						top: 50%
						right: $input-thick-padding

						width: $input-icon-size
						height: $input-icon-size

						filter: $gray-filter
						pointer-events: none

				.option
					display: grid
					grid-template: "label validation preview" auto / 1fr max-content auto
					place-items: center start
					gap: $input-thick-padding

					width: 100%
					padding: $input-thin-padding $input-thick-padding

					cursor: pointer
					text-align: left
					background: $white

					&:last-child
						border-bottom-width: 1px
						border-radius: 0 0 $default-border-radius $default-border-radius

					&:not(:disabled)
						&:hover, &:focus
							background: $light-gray

					&:disabled
						cursor: not-allowed
						color: $placeholder-color

					& > *
						pointer-events: none

					.error, .warning
						display: flex
						flex-flow: row nowrap
						align-items: center
						gap: $form-small-gap

						img
							width: $input-icon-size
							height: $input-icon-size

					.error
						filter: $red-filter

					.warning
						filter: $yellow-filter

					.preview
						width: $input-icon-size
						height: $input-icon-size

					i
						color: $placeholder-color

</style>