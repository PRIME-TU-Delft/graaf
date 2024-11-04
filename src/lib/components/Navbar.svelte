
<script lang="ts">

	// Exports
	export let path: { name: string, href: string }[] = []

</script>


<!-- Markup -->


<nav>
	{#each path as link, index}
		<a href={link.href}> {link.name} </a>
		{#if index < path.length - 1}
			/&nbsp;
		{/if}
	{/each}
</nav>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	nav
		color: $purple
		font-size: 1.75rem
		transition: all $default-transition

		a:hover
			cursor: pointer
			color: $dark-purple
			text-decoration: underline

</style>