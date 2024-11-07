
<script lang="ts">

	import { page } from '$app/stores'

</script>


<!-- Markup -->


<div>
	<h1>{$page.status}</h1>
	<p>{$page.error?.message}</p>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	div
		position: absolute
		translate: -50% -50%
		top: 50%
		left: 50%

		display: flex
		flex-flow: column nowrap
		align-items: center

	h1
		color: $dark-purple
	p
		color: $purple

</style>
