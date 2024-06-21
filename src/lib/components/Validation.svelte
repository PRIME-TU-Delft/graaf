
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
	export let short: boolean = false
	export let success_msg: string = ''
	export let goto_anchor: (tab: number, id: string) => void = () => {}

	// Variables
	let dropdown: boolean = false
	let error_dropdown: boolean = false
	let warning_dropdown: boolean = false

	// Functions
	function show_dropdown() {
		dropdown = true
		error_dropdown = false
		warning_dropdown = false
	}

	function hide_dropdown() {
		dropdown = false
	}

	function show_errors() {
		dropdown = false
		error_dropdown = true
		warning_dropdown = false
	}

	function hide_errors() {
		error_dropdown = false
	}

	function show_warnings() {
		dropdown = false
		warning_dropdown = true
		error_dropdown = false
	}

	function hide_warnings() {
		warning_dropdown = false
	}

</script>


<!-- Markup -->


<div class="validation">



	{#if short}

		{#if data.severity !== 'success'}
			<button
				class={data.severity === 'error' ? 'error toggle' : 'warning toggle'}
				on:click={show_dropdown} 
				use:tooltip={`
					${dropdown ? 'Hide' : 'Show'}
					${data.errors.length > 0 ? 'errors' : ''}
					${data.errors.length > 0 && data.warnings.length > 0 ? ' & ' : ''}
					${data.warnings.length > 0 ? 'warnings' : ''}
					`
				}
			>
				<img 
					src={data.severity === 'error' ? errorIcon : warningIcon}
					alt=""
				>
			</button>
		{/if}
		
		{#if dropdown}
			<div class="dropdown" use:clickoutside={hide_dropdown}>
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
			<button class="error toggle" on:click={show_errors} use:tooltip={error_dropdown ? 'Hide errors' : 'Show errors'} >
				<img src={errorIcon} alt="" /> {data.errors.length}
			</button>

			{#if error_dropdown}
				<div class="dropdown" use:clickoutside={hide_errors}>
					{#each data.errors as error}
						<div class="error item">
							<img src={errorIcon} alt="" />
							<span class="short"> {error.short} </span>

							{#if error.tab !== undefined && error.id !== undefined}
								<span class="show">
									(<button on:click={() => {
										hide_errors()
										if (error.tab !== undefined && error.id !== undefined)
											goto_anchor(error.tab, error.id)
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
			<button class="warning toggle" on:click={show_warnings} use:tooltip={warning_dropdown ? 'Hide warnings' : 'Show warnings'} >
				<img src={warningIcon} alt="" /> {data.warnings.length}
			</button>

			{#if warning_dropdown}
				<div class="dropdown" use:clickoutside={hide_warnings}>
					{#each data.warnings as warning}
						<div class="warning item">
							<img src={warningIcon} alt="" />
							<span class="short"> {warning.short} </span>

							{#if warning.tab !== undefined && warning.id !== undefined}
								<span class="show">
									(<button on:click={() => {
										hide_warnings()
										if (warning.tab !== undefined && warning.id !== undefined)
											goto_anchor(warning.tab, warning.id)
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

		{#if data.severity === 'success'}
			<span class="success">
				<img src={successIcon} alt=""> {success_msg} 
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