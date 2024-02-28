
<!-- Markup -->

<section class="card">
	<section class="header"><slot name="header"> Card </slot></section>
	<section class="body"><slot name="body"> Lorum ipsum dolor sid amed. </slot></section>
</section>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.card
		display: flex
		flex-flow: column nowrap
		align-items: stretch

		width: 100%

		border-radius: variables.$border-radius
		border: 1px solid variables.$gray

		.header
			display: flex
			flex-flow: row nowrap
			align-items: center

			padding: 0.75rem 1.5rem

			background-color: variables.$light-gray
			border-radius: calc(variables.$border-radius - 1px) calc(variables.$border-radius - 1px) 0 0
			border-bottom: 1px solid variables.$gray

		.body
			display: flex
			flex-flow: column nowrap
			align-items: stretch

			padding: 1.5rem

			background-color: variables.$white
			border-radius: 0 0 calc(variables.$border-radius - 1px) calc(variables.$border-radius - 1px)

</style>
