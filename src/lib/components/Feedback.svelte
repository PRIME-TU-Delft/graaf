
<script lang="ts">

	// External dependencies
	import { fade } from 'svelte/transition'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import { Validation } from '$scripts/validation'
	import { clickoutside } from '$scripts/actions/clickoutside'

	// Assets
	import error_icon from '$assets/error-icon.svg'
	import warning_icon from '$assets/warning-icon.svg'
	
	// Functions
	function onMouseEnter() {
		timeout = setTimeout(() => {
			show_dropdown = data.errors.length + data.warnings.length > 1 || compact
		}, 800)
	}

	function onMouseLeave() {
		clearTimeout(timeout)
		show_dropdown = lock_dropdown
	}

	function setDropdown(value?: boolean) {
		if (value !== undefined) lock_dropdown = value
		else lock_dropdown = !lock_dropdown && (data.errors.length + data.warnings.length > 1 || compact)
		show_dropdown = lock_dropdown
		clearTimeout(timeout)
	}

	// Exports
	export let data: Validation
	export let compact: boolean = false
	export let animate: boolean = false

	// Main
	let timeout: NodeJS.Timeout
	let show_dropdown = false
	let lock_dropdown = false

	$: show_error_icon = data.errors.length > 0
	$: error_message = compact || data.errors.length === 0 ? ''
					 : data.errors.length > 0 && data.warnings.length > 0 ? data.errors.length
					 : data.errors.length > 1 ? `${data.errors[0].short} (${data.errors.length - 1} more)`
					 : data.errors[0].short

	$: show_warning_icon = !(compact && show_error_icon) && data.warnings.length > 0
	$: warning_message = compact || data.warnings.length === 0 ? ''
					   : data.errors.length > 0 && data.warnings.length > 0 ? data.warnings.length
					   : data.warnings.length > 1 ? `${data.warnings[0].short} (${data.warnings.length - 1} more)`
					   : data.warnings[0].short

</script>

<!-- Markup -->

<div class="feedback" use:clickoutside={ () => setDropdown(false) }>
	<button 
		class="toggle" 
		on:mouseenter={ onMouseEnter }
		on:mouseleave={ onMouseLeave }
		on:click={ () => setDropdown() }
		disabled={ data.errors.length === 0 && data.warnings.length === 0 }
	>
		{#if show_error_icon}
			<img 
				src={error_icon} 
				alt="Error" 
				class="error" 
				transition:fade={{ duration: animate ? settings.ANIMATION_DURATION : 0}}
			>
		{/if}

		{#if error_message}
			<span 
				class="error"
				transition:fade={{ duration: animate ? settings.ANIMATION_DURATION : 0}}
			> {error_message} </span>
		{/if}

		{#if show_warning_icon}
			<img
				src={warning_icon}
				alt="Warning"
				class="warning"
				transition:fade={{ duration: animate ? settings.ANIMATION_DURATION : 0}}
			>
		{/if}

		{#if warning_message}
			<span
				class="warning"
				transition:fade={{ duration: animate ? settings.ANIMATION_DURATION : 0}}
			> {warning_message} </span>
		{/if}
	</button>

	{#if show_dropdown}
		<div class="dropdown">
			{#each data.errors as error}
				<div class="error item">
					<img src={error_icon} alt="" />
					<span class="short"> {error.short} </span>

					{#if error.long !== undefined}
						<span class="long"> {error.long} </span>
					{/if}
				</div>
			{/each}

			{#each data.warnings as warning}
				<div class="warning item">
					<img src={warning_icon} alt="" />
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

	.feedback
		position: relative

		img
			width: $input-icon-size
			height: $input-icon-size
			pointer-events: none

		span
			color: black
			pointer-events: none

		.error
			filter: $red-filter

		.warning
			filter: $yellow-filter

		.toggle
			display: flex
			flex-flow: row nowrap
			align-items: center
			gap: $input-thin-padding

			height: calc( 1.5rem + 2 * $input-thin-padding + 2px )
			min-width: $total-icon-size
			padding: $input-icon-padding

			&:not(:disabled)
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
				grid-template: "icon short" auto "icon long" auto / $input-icon-size auto 1fr
				column-gap: $input-thin-padding
				place-items: start center

				img
					grid-area: icon

					width: $input-icon-size
					height: $input-icon-size
					margin-top: 0.7rem - $input-icon-size * 0.5

				.short
					grid-area: short

				.long
					grid-area: long
					font-size: 0.8rem

</style>
