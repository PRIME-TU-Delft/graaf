<script lang="ts">
	interface Props {
		title?: import('svelte').Snippet;
		toolbar?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { title, toolbar, children }: Props = $props();
</script>


<main>
	<section class="title">
		{@render title?.()}
	</section>

	{#if toolbar}
		<section class="toolbar">
			{@render toolbar?.()}
		</section>
	{/if}

	<section class="content">
		{@render children?.()}
	</section>
</main>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	main
		display: flex
		flex-flow: column nowrap
		place-items: stretch start

		box-sizing: content-box
		min-width: $small-column
		max-width: $big-column

		margin: auto
		padding: $main-padding $tudelft-logo-width $footer-height

		@media screen and (max-width: $phone-breakpoint)
			width: $small-column
			padding: $main-padding
			padding-bottom: $footer-height

		.title
			margin-bottom: 2rem
			color: $dark-gray

		.toolbar
			display: flex
			flex-flow: row nowrap
			place-items: center start
			gap: $form-small-gap

			margin-bottom: 1rem

		.content
			display: flex
			flex-flow: column nowrap
			place-items: stretch start
			gap: 2rem

			position: relative

</style>