
<div class="card">
	<header class="header"><slot name="header" /></header>
	<section class="body"><slot name="body" /></section>
</div>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.card
		display: flex
		flex-flow: column nowrap
		align-items: stretch

		border: 1px solid $gray
		border-radius: $border-radius

		.header
			display: flex
			flex-flow: row nowrap
			align-items: center

			padding: $card-thin-padding $card-thick-padding

			background-color: $light-gray
			border-bottom: 1px solid $gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

		.body
			display: flex
			flex-flow: column nowrap

			padding: $card-thick-padding

			background-color: $white
			border-radius: 0 0 calc($border-radius - 1px) calc($border-radius - 1px)

</style>
