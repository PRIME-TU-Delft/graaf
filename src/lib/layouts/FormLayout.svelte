
<!-- Markup -->

<div class="layout">
	<slot />
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.layout
		width: 100%
		max-width: variables.$small-column

</style>