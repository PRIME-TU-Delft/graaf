
<main>
	<section class="title">
		<slot name="title" />
	</section>

	{#if $$slots.toolbar}
		<section class="toolbar">
			<slot name="toolbar" />
		</section>
	{/if}

	<section class="content">
		<slot />
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
		padding: $main-padding $tudelft-logo-width

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

</style>