
<script lang="ts">

	import { Validation, Severity } from "$scripts/validation"

	import error_icon from "$assets/error-icon.svg"
	import warning_icon from "$assets/warning-icon.svg"
	import search_icon from "$assets/search-icon.svg"

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') { 
			open = false
			return
		}

		if (event.key == 'Tab') {
			return
		}

		if (event.key === 'Enter') {
			return
		}

		search.focus()
	}

	type T = number
	type DropdownOption = {
		value: T
		label: string
		validation?: Validation
		color?: string
	}

	export let placeholder: string = 'Select an option'
	export let options: DropdownOption[]
	export let value: T | null

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

<div class="dropdown-wrapper">
	<div class="dropdown" class:open>
		<button class="header" on:click={ () => open = !open }>
			{ selected ? selected.label : placeholder }
		</button>

		{#if open}
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
					/>

					<img src={ search_icon } alt="Search" />
				</div>

				{#each filtered_options as option}
					<button 
						class="option" 
						disabled={ option.validation?.severity === Severity.error }
						on:click={ () => { 
							value = option.value
							open = false
						}}
					>
						{ option.label }

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
						on:click={ () => { 
							value = null
							open = false
						}}>
						<i> Remove choice </i>
					</button>
				{:else if filtered_options.length === 0}
					<button disabled class="option">
						<i> No results found </i>
					</button>
				{/if}
			{/if}
		{/if}
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use '$styles/variables.sass' as *
	@use '$styles/palette.sass' as *
	@use 'sass:math'

	.dropdown-wrapper
		position: relative

		width: 100%
		height: calc( 1.5rem + 2 * $input-thin-padding + 2px )

		.dropdown
			position: absolute
			z-index: 1
			left: 0

			width: 100%
			overflow: hidden
			background: $white

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

				border: 1px solid $gray
				border-radius: $border-radius

			&.open
				&::after
					translate: 0 50%
					rotate: -135deg

				.header
					border-bottom: 1px dashed $gray
					border-radius: $border-radius $border-radius 0 0

				.search
					position: relative

					border-width: 0 1px
					border-style: solid
					border-color: $gray

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

					border-width: 0 1px
					border-style: solid
					border-color: $gray

					cursor: pointer

					&:last-child
						border-bottom-width: 1px
						border-radius: 0 0 $border-radius $border-radius

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

			&:focus-within
				.header, .search, .option	
					border-color: $tudelft-blue
				&.open .header
					border-bottom-color: $gray	

</style>