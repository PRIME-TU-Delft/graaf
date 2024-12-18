<script lang="ts">
	// Internal dependencies
	import * as settings from '$scripts/settings';
	import { Validation } from '$scripts/validation';
	import { clickoutside } from '$scripts/actions/clickoutside';

	// Assets
	import error_icon from '$assets/error-icon.svg';
	import warning_icon from '$assets/warning-icon.svg';

	// Functions
	function onMouseEnter() {
		timeout = setTimeout(() => {
			show_dropdown = data.errors.length + data.warnings.length > 1 || compact;
		}, settings.UNIVERSAL_HOVER_DELAY);
	}

	function onMouseLeave() {
		clearTimeout(timeout);
		show_dropdown = lock_dropdown;
	}

	function setDropdown(value?: boolean) {
		if (value !== undefined) lock_dropdown = value;
		else
			lock_dropdown = !lock_dropdown && (data.errors.length + data.warnings.length > 1 || compact);
		show_dropdown = lock_dropdown;
		clearTimeout(timeout);
	}

	interface Props {
		// Exports
		data: Validation;
		compact?: boolean;
	}

	let { data, compact = false }: Props = $props();

	// Main
	let timeout: ReturnType<typeof setTimeout>;
	let show_dropdown = $state(false);
	let lock_dropdown = false;

	let show_error_icon = $derived(data.errors.length > 0);
	let error_message = $derived(
		compact || data.errors.length === 0
			? ''
			: data.errors.length > 0 && data.warnings.length > 0
				? data.errors.length
				: data.errors.length > 1
					? `${data.errors[0].short} (${data.errors.length - 1} more)`
					: data.errors[0].short
	);

	let show_warning_icon = $derived(!(compact && show_error_icon) && data.warnings.length > 0);
	let warning_message = $derived.by(() => {
		if (compact || data.warnings.length === 0) return '';

		if (data.errors.length > 0) {
			if (data.warnings.length > 1)
				return `${data.warnings[0].short} (${data.warnings.length - 1} more)`;
			return data.warnings[0].short;
		}

		if (data.warnings.length > 1)
			return `${data.warnings[0].short} (${data.warnings.length - 1} more)`;

		return data.warnings[0].short;
	});

	let disable_toggle = $derived(
		(!compact && data.errors.length + data.warnings.length < 2) ||
			(compact && data.errors.length + data.warnings.length < 1)
	);

	$effect(() => {
		if (disable_toggle) setDropdown(false);
	});
</script>

<!-- Markup -->

<div class="feedback" use:clickoutside={() => setDropdown(false)}>
	<button
		class="toggle"
		onmouseenter={onMouseEnter}
		onmouseleave={onMouseLeave}
		onclick={() => setDropdown()}
		disabled={disable_toggle}
	>
		{#if show_error_icon}
			<img src={error_icon} alt="Error" class="error" />
		{/if}

		{#if error_message}
			<span class="error"> {error_message} </span>
		{/if}

		{#if show_warning_icon}
			<img src={warning_icon} alt="Warning" class="warning" />
		{/if}

		{#if warning_message}
			<span class="warning"> {warning_message} </span>
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

			height: $total-icon-size
			min-width: $total-icon-size
			padding: $input-icon-padding

			border-radius: $default-border-radius

			&:not(:disabled)
				cursor: pointer
			
			&:focus-visible
				outline: $default-outline
			
		.dropdown
			position: absolute
			top: calc( 100% + $input-thin-padding )
			z-index: 1

			width: max-content
			padding: $card-thin-padding

			background: $white
			border: 1px solid $gray
			border-radius: $default-border-radius

			box-shadow: $default-box-shadow

			.item
				display: grid
				grid-template: "icon short" auto "icon long" auto / $input-icon-size auto 1fr
				column-gap: $input-thin-padding

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
