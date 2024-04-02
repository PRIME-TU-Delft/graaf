
<!-- Script -->

<script lang="ts">

	export let href: string | undefined = undefined;

	export let submit: boolean = false;
	export let disabled: boolean = false;
	export let scale: boolean = false;
	export let rotate: boolean = false;

	$: if (submit && href !== undefined) {
		console.warn("LinkButton: submit type does not require a 'href' prop. Ignoring 'href' prop.");
		href = undefined;
	}

</script>

<!-- Markup -->

{#if href === undefined}

	<button
		type={submit ? "submit" : "button"}
		class="link-button" class:disabled class:scale class:rotate
		on:click
	>
		<slot />
	</button>

{:else}

	<a
		href={href}
		class="link-button" class:disabled class:scale class:rotate
		on:click
	>
		<slot />
	</a>

{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-button
		display: inline-flex
		flex-flow: row nowrap
		place-items: center start
 
		padding: $input-thin-padding $input-thick-padding

		border: 1px solid transparent
		color: $purple

		cursor: pointer
		transition: all $default-transition

		&.disabled
			color: $gray
			pointer-events: none

			:global(img)
				filter: $gray-filter

		&:has(img)
			padding-left: $input-thin-padding

		:global(img)
			box-sizing: content-box
			width: $input-icon-size
			padding-right: $input-thin-padding

			filter: $purple-filter
			transition: all $default-transition

		&:hover
			color: $dark-purple
			text-decoration: underline

			:global(img)
				filter: $dark-purple-filter
			&.scale :global(img)
				scale: $scale-on-hover
			&.rotate :global(img)
				rotate: $rotate-on-hover
		
	:global(.link-button) + .link-button, :global(.icon-button) + .link-button
		padding-left: $input-thin-padding

</style>