<!-- Markup -->

<div class="column">
	<slot />
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.column
		max-width: $small-column

</style>
