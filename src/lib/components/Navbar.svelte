<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		// Exports
		path?: { name: string; href?: string }[];
		children?: Snippet;
	}

	let { path = [], children }: Props = $props();
</script>

<!-- Markup -->

<nav>
	<span class="url">
		{#each path as link, index}
			{#if link.href}
				<a href={link.href}> {link.name} </a>
			{:else}
				{link.name}
			{/if}

			{#if index < path.length - 1}
				/&nbsp;
			{/if}
		{/each}
	</span>

	<div class="flex-spacer"></div>

	{@render children?.()}
</nav>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	nav
		display: flex
		flex-flow: row nowrapwrap
		align-items: start

		:global(.link-button)
			margin-right: -$input-thick-padding
			line-height: 2.125rem

		.url
			color: $purple
			font-size: 1.75rem
			transition: all $default-transition

			a:hover, a:focus-visible
				cursor: pointer
				color: $dark-purple
				text-decoration: underline

</style>
