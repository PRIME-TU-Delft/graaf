
<script lang="ts">

	// Internal imports
	import { Severity, ValidationData } from '$scripts/entities'
	import { clickoutside } from '$scripts/clickoutside'
	import { tooltip } from '$scripts/tooltip'

	// Assets
	import errorIcon from '$assets/error-icon.svg'
	import warningIcon from '$assets/warning-icon.svg'
	import successIcon from '$assets/success-icon.svg'
	import { error } from '@sveltejs/kit';

	// Exports
	export let data: ValidationData
	export let short: boolean = false
	export let success: string = ''
	export let goto_anchor: (tab: number, id: string) => void = () => {}

	// Variables
	let all_visible: boolean = false
	let errors_visible: boolean = false
	let warnings_visible: boolean = false

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

	{#if short}

		{#if data.severity !== Severity.success}
			<button
				type="button" 
				class="toggle"
				class:error={data.severity === Severity.error}
				class:warning={data.severity === Severity.warning}
				tabindex="-1"
				on:click={show_all}
				use:tooltip={`
					${all_visible ? 'Hide' : 'Show'}
					${data.errors.length > 0 ? 'error' : ''}${data.errors.length > 1 ? 's' : ''}
					${data.errors.length > 0 && data.warnings.length > 0 ? ' & ' : ''}
					${data.warnings.length > 0 ? 'warning' : ''}${data.warnings.length > 1 ? 's' : ''}
					`
				}
			>
				<img
					src={data.severity === Severity.error ? errorIcon : warningIcon}
					alt=""
				>
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

	{:else}

		{#if data.errors.length > 0}
			<button
				type="button"
				class="error toggle"
				tabindex="-1"
				on:click={show_errors}
				use:tooltip={errors_visible ? 'Hide errors' : 'Show errors'}
			>
				<img src={errorIcon} alt="" /> {
					data.warnings.length || data.errors.length > 1
						? data.errors.length
						: data.errors[0].short
				}
			</button>

			{#if errors_visible}
				<div class="dropdown" use:clickoutside={hide_errors}>
					{#each data.errors as error}
						<div class="error item">
							<img src={errorIcon} alt="" />
							<span class="short"> {error.short} </span>

							{#if error.tab !== undefined && error.anchor !== undefined}
								<span class="show">
									(<button on:click={() => {
										hide_errors()
										if (error.tab !== undefined && error.anchor !== undefined)
											goto_anchor(error.tab, error.anchor)
									}}> show </button>)
								</span>
							{/if}

							{#if error.long !== undefined}
								<span class="long"> {error.long} </span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		{#if data.warnings.length > 0}
			<button
				class="warning toggle"
				tabindex="-1"
				on:click={show_warnings}
				use:tooltip={warnings_visible ? 'Hide warnings' : 'Show warnings'}
			>
				<img src={warningIcon} alt="" /> {
					data.errors.length || data.warnings.length > 1
						? data.warnings.length
						: data.warnings[0].short
				}
			</button>

			{#if warnings_visible}
				<div class="dropdown" use:clickoutside={hide_warnings}>
					{#each data.warnings as warning}
						<div class="warning item">
							<img src={warningIcon} alt="" />
							<span class="short"> {warning.short} </span>

							{#if warning.tab !== undefined && warning.anchor !== undefined}
								<span class="show">
									(<button on:click={() => {
										hide_warnings()
										if (warning.tab !== undefined && warning.anchor !== undefined)
											goto_anchor(warning.tab, warning.anchor)
									}}> show </button>)
								</span>
							{/if}

							{#if warning.long !== undefined}
								<span class="long"> {warning.long} </span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		{/if}

		{#if data.severity === Severity.success && success !== ''}
			<span class="success">
				<img src={successIcon} alt=""> {success}
			</span>
		{/if}

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

		margin: 0 $form-medium-gap

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

				.show
					grid-area: show
					place-self: center start
					font-size: 0.8rem

					button
						text-decoration: underline

				.long
					grid-area: long
					font-size: 0.8rem

</style>