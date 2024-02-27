
<!-- Markup -->

<div class="card">
	<div class="header"><slot name="header" /></div>
	<div class="body"><slot name="body" /></div>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.card
		display: flex
		flex-flow: column nowrap
		align-items: stretch

		width: 100%

		border-radius: 0.25rem
		border: 1px solid variables.$gray

		.header
			padding: 1rem variables.$card-padding

			background-color: variables.$light-gray
			border-radius: calc(.25rem - 1px) calc(.25rem - 1px) 0 0
			border-bottom: 1px solid variables.$gray

		.body
			padding: variables.$card-padding

			background-color: variables.$white

</style>
