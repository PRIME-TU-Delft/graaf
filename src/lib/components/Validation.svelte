
<script lang="ts">

	// Internal imports
	import { ValidationData } from '$scripts/validation'
	import { clickoutside } from '$scripts/clickoutside'
	import { tooltip } from '$scripts/tooltip'

	// Assets
	import errorIcon from '$assets/error-icon.svg'
	import warningIcon from '$assets/warning-icon.svg'
	import successIcon from '$assets/success-icon.svg'

	// Exports
	export let data: ValidationData
	export let compact: boolean = false
	export let success_msg: string = ''

	// Variables
	let all_visible: boolean = false
	let errors_visible: boolean = false
	let warnings_visible: boolean = false

	$: show_success_icon = !has_errors && !has_warnings && !compact && success_msg !== ''

	$: one_error = data.errors.length === 1
	$: has_errors = data.errors.length > 0
	$: multiple_errors = data.errors.length > 1

	$: show_error_icon = has_errors
	$: error_disabled = !compact && one_error && !has_warnings
	$: error_msg = compact ? '' : error_disabled ? data.errors[0].short : data.errors.length

	$: one_warning = data.warnings.length === 1
	$: has_warnings = data.warnings.length > 0
	$: multiple_warnings = data.warnings.length > 1

	$: show_warning_icon = has_warnings && (!compact || !has_errors)
	$: warning_disabled = !compact && one_warning && !has_errors
	$: warning_msg = compact ? '' : warning_disabled ? data.warnings[0].short : data.warnings.length

	$: error_tooltip = error_disabled ? ''
					 : compact ? compact_tooltip
					 : errors_visible ? 'Hide errors'
					 : 'Show errors'

	$: warning_tooltip = warning_disabled ? ''
					   : compact ? compact_tooltip
					   : warnings_visible ? 'Hide warnings'
					   : 'Show warnings'

	$: compact_tooltip = (all_visible ? 'Hide ' : 'Show ')
					   + (has_errors ? 'error' : '')
					   + (multiple_errors ? 's' : '')
					   + (has_errors && has_warnings ? ' & ' : '')
					   + (has_warnings ? 'warning' : '')
					   + (multiple_warnings ? 's' : '')

	// Functions
	export function show_all() {
		all_visible = true
		errors_visible = false
		warnings_visible = false
	}

	export function hide_all() {
		all_visible = false
	}

	export function show_errors() {
		all_visible = false
		errors_visible = true
		warnings_visible = false
	}

	export function hide_errors() {
		errors_visible = false
	}

	export function show_warnings() {
		all_visible = false
		warnings_visible = true
		errors_visible = false
	}

	export function hide_warnings() {
		warnings_visible = false
	}

</script>


<!-- Markup -->


<div class="validation">

	{#if show_success_icon}
		<span class="success">
			<img src={successIcon} alt="" /> {success_msg}
		</span>
	{/if}

	{#if show_error_icon}
		<button
			type="button"
			class="error toggle"
			tabindex="-1"
			on:click={compact ? show_all : show_errors}
			disabled={error_disabled}
			use:tooltip={error_tooltip}
		>
			<img src={errorIcon} alt="" /> {error_msg}
		</button>
	{/if}

	{#if show_warning_icon}
		<button
			type="button"
			class="warning toggle"
			tabindex="-1"
			on:click={compact ? show_all : show_warnings}
			disabled={warning_disabled}
			use:tooltip={warning_tooltip}
		>
			<img src={warningIcon} alt="" /> {warning_msg}
		</button>
	{/if}

	{#if all_visible}
		<div class="dropdown" use:clickoutside={hide_all}>
			{#each data.errors as error}
				<div class="error item">
					<img src={errorIcon} alt="" />
					<span class="short"> {error.short} </span>

					{#if error.long !== undefined}
						<span class="long"> {error.long} </span>
					{/if}
				</div>
			{/each}

			{#each data.warnings as warning}
				<div class="warning item">
					<img src={warningIcon} alt="" />
					<span class="short"> {warning.short} </span>

					{#if warning.long !== undefined}
						<span class="long"> {warning.long} </span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if errors_visible}
		<div class="dropdown" use:clickoutside={hide_errors}>
			{#each data.errors as error}
				<div class="error item">
					<img src={errorIcon} alt="" />
					<span class="short"> {error.short} </span>

					{#if error.long !== undefined}
						<span class="long"> {error.long} </span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	{#if warnings_visible}
		<div class="dropdown" use:clickoutside={hide_warnings}>
			{#each data.warnings as warning}
				<div class="warning item">
					<img src={warningIcon} alt="" />
					<span class="short"> {warning.short} </span>

					{#if warning.long !== undefined}
						<span class="long"> {warning.long} </span>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.validation
		display: flex
		position: relative
		gap: $input-thin-padding

		.success
			display: flex
			align-items: center
			gap: $input-thin-padding
			color: $green

			img
				width: $input-icon-size
				height: $input-icon-size
				filter: $green-filter

		.warning
			color: $yellow
			filter: $yellow-filter

		.error
			color: $red
			filter: $red-filter

		.toggle
			display: flex
			align-items: center
			gap: $input-thin-padding

			&:not(:disabled)
				cursor: pointer

			img
				width: $input-icon-size
				height: $input-icon-size
				cursor: pointer

		.dropdown
			position: absolute
			top: calc( 100% + $input-thin-padding )
			z-index: 1

			width: max-content
			padding: $card-thin-padding

			background: $white
			border: 1px solid $gray
			border-radius: $border-radius

			box-shadow: $shadow

			.item
				display: grid
				grid-template: "icon short show" auto "icon long long" auto / $input-icon-size auto 1fr
				column-gap: $input-thin-padding

				img
					grid-area: icon

					width: $input-icon-size
					height: $input-icon-size
					margin-top: $input-icon-padding

				.short
					grid-area: short

				.long
					grid-area: long
					font-size: 0.8rem

</style>