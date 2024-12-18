<script lang="ts">
	// Internal imports
	import { tooltip } from '$scripts/actions/tooltip';

	interface Props {
		// Exports
		src: string;
		description?: string;
		href?: string | undefined;
		submit?: boolean;
		disabled?: boolean;
		scale?: boolean;
		onclick?: (event: MouseEvent) => void;
	}

	let {
		src,
		description = '',
		href = $bindable(undefined),
		submit = false,
		disabled = false,
		scale = false,
		onclick = () => {}
	}: Props = $props();

	// Property validation
	$effect(() => {
		if (submit && href !== undefined) {
			console.warn("Button: submit type does not require a 'href' prop. Ignoring 'href' prop.");
			href = undefined;
		}
	});
</script>

<!-- Markup -->

{#if href === undefined}
	<button
		type={submit ? 'submit' : 'button'}
		class="icon-button"
		class:disabled
		class:scale
		use:tooltip={description}
		{onclick}
	>
		<img {src} alt={description} class="icon" />
	</button>
{:else}
	<a {href} class="icon-button" class:disabled class:scale use:tooltip={description} {onclick}>
		<img {src} alt="" class="icon" />
	</a>
{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.icon-button
		display: flex
		align-items: center
		justify-content: center

		width: $total-icon-size
		height: $total-icon-size
		padding: $input-icon-padding

		border-radius: $default-border-radius

		cursor: pointer

		.icon
			width: $input-icon-size
			height: $input-icon-size

			filter: $purple-filter
			transform-origin: center
			pointer-events: none

		&.disabled
			pointer-events: none

			.icon
				filter: $gray-filter

		&:focus-visible
			outline: $default-outline

		&:hover
			.icon
				filter: $dark-purple-filter

			&.scale .icon
				scale: $scale-on-hover

</style>
