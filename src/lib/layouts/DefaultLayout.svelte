
<script lang="ts">

	// Exports
	export let description: string = 'Lorum ipsum dolor sid amed.'
	export let path: { [key: string]: string }[] = []
	
</script>



<!-- Markup -->



<div class="layout">
	<header class="header">
		<nav>
			{#each path as link, index}
				<a href={link.href}> {link.name} </a>
				{#if index < path.length - 1}
					/&nbsp;
				{/if}
			{/each}
		</nav>

		{description}
	</header>

	{#if $$slots.toolbar}
		<section class="toolbar"><slot name="toolbar" /></section>
	{/if}

	<section class="body">
		<slot />
	</section>
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.layout
		display: flex
		flex-flow: column nowrap
		place-items: stretch start

		width: 100%
		max-width: $big-column

		.header
			margin-bottom: 2rem
			color: $dark-gray

			nav
				color: $purple
				font-size: 1.75rem
				transition: all $default-transition

				a:hover
					cursor: pointer
					color: $dark-purple
					text-decoration: underline

		.toolbar
			display: flex
			flex-flow: row nowrap
			place-items: center start
			gap: $form-small-gap

			margin-bottom: 1rem

		.body
			display: flex
			flex-flow: column nowrap
			place-items: stretch start
			gap: 1rem

</style>
