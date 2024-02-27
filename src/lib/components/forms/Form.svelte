
<!-- Markup -->

<form>
	<slot />
</form>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	form
		display: flex
		flex-flow: column nowrap
		align-items: stretch
		gap: 1rem

		width: 100%

</style>