
<script lang="ts">

	// Internal imports
	import { ValidationData } from '$scripts/entities'
	import { clickoutside } from '$scripts/clickoutside'
	import { tooltip } from '$scripts/tooltip'

	// Assets
	import errorIcon from '$assets/error-icon.svg'
	import warningIcon from '$assets/warning-icon.svg'
	import successIcon from '$assets/success-icon.svg'

	// Exports
	export let data: ValidationData
	export let scroll_to_anchor: (tab: number, id: string) => void

	// Variables
	let error_dropdown: boolean = false
	let warning_dropdown: boolean = false

	// Functions
	function show_errors() {
		error_dropdown = true
		warning_dropdown = false
	}

	function hide_errors() {
		error_dropdown = false
	}

	function show_warnings() {
		warning_dropdown = true
		error_dropdown = false
	}

	function hide_warnings() {
		warning_dropdown = false
	}

</script>


<!-- Markup -->

{#if data.errors.length + data.warnings.length > 1}

	<div class="multiple">
		<button class="error" on:click={show_errors} use:tooltip={error_dropdown ? 'Hide errors' : 'Show errors'} >
			<img src={errorIcon} alt="" /> {data.errors.length}
		</button>

		<button class="warning" on:click={show_warnings} use:tooltip={warning_dropdown ? 'Hide warnings' : 'Show warnings'} >
			<img src={warningIcon} alt=""> {data.warnings.length}
		</button>

		{#if error_dropdown}
			<div class="dropdown" use:clickoutside={hide_errors}>
				{#each data.errors as error}
					<span class="error">
						<img src={errorIcon} alt="" />
						{error.short}
						{#if error.tab !== undefined && error.tab !== null}
							<button on:click={() => {
								if (error.tab !== undefined && error.id !== undefined)
									scroll_to_anchor(error.tab, error.id)
							}}>(show)</button>
						{/if}
					</span>
				{/each}

				{#if data.errors.length === 0}
					<span class="grayed"> No errors </span>
				{/if}
			</div>
		{/if}

		{#if warning_dropdown}
			<div class="dropdown" use:clickoutside={hide_warnings}>
				{#each data.warnings as warning}
					<span class="warning">
						<img src={warningIcon} alt="" />
						{data.warnings[0].short}
						{#if data.warnings[0].tab !== undefined}
							<button on:click={() => {
								if (warning.tab !== undefined && warning.id !== undefined)
									scroll_to_anchor(warning.tab, warning.id)
							}}>(show)</button>
						{/if}
					 </span>
				{/each}

				{#if data.warnings.length === 0}
					<span class="grayed"> No warnings </span>
				{/if}
			</div>
		{/if}
	</div>

{:else if data.severity === 'error'}

	<span class="error">
		<img src={errorIcon} alt="" />
		{data.errors[0].short}
		{#if data.errors[0].tab !== undefined}
			jemeoder
		{/if}
	</span>

{:else if data.severity === 'warning'}

	<span class="warning">
		<img src={warningIcon} alt="" />
		{data.warnings[0].short}
		{#if data.warnings[0].tab !== undefined}
			jemeoder
		{/if}
	</span>

{:else}

	<span class="success">
		<img src={successIcon} alt=""> Everything is good!
	</span>

{/if}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.error, .warning, .success, .multiple
		display: flex
		align-items: center
		gap: $form-small-gap

		img
			width: $input-icon-size
			height: $input-icon-size
			grid-area: icon

			pointer-events: none
		
		button
			text-decoration: underline
			font-size: 0.85rem

	.grayed
		color: $gray

	.error
		color: $red
		img
			filter: $red-filter

	.warning
		color: $yellow
		img
			filter: $yellow-filter

	.success
		color: $green
		img
			filter: $green-filter

	.multiple
		position: relative

		button
			cursor: pointer

		.dropdown
			position: absolute
			top: calc(100% + $form-small-gap)
			z-index: 1

			width: max-content
			max-height: $max-dropdown-height
			padding: $card-thin-padding
			overflow-y: scroll

			background: $white
			border: 1px solid $gray
			border-radius: $border-radius

			.item
				display: grid
				place-items: center start
				grid-template: "icon short" auto ". long" auto / $input-icon-size 1fr
				row-gap: 0 // I dont understand why gap is inherited, but oh well

				.short
					grid-area: short

				.long
					grid-area: long
					font-size: 0.8rem

</style>