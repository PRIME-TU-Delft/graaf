
<!-- Script -->

<script lang="ts">

	import '$styles/global.sass';

	import PRIME_logo from '$assets/PRIME-logo.svg';
	import TUDelft_logo from '$assets/TUD-logo.svg';

	let loggedIn = false; // TODO temporary

</script>

<!-- Markup -->

<header>
	<a id="PRIME-logo" href="/"><img src={PRIME_logo} alt="PRIME logo"></a>
	<h1>Graph editor</h1>

	<div class="flex-spacer" />

	{#if loggedIn}
		<a class="link-btn" href="/auth/logout">Logout</a>
		<a class="btn" href="/dashboard">Dashboard</a>
	{:else}
		<a class="link-btn" href="/auth/register">Register</a>
		<a class="btn" href="/auth/login">Login</a>
	{/if}
</header>

<main>
	<slot />
</main>

<footer>
	<img id="TUDelft-logo" src={TUDelft_logo} alt="TUDelft logo">
</footer>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	header
		display: flex
		flex-flow: row nowrap
		align-items: center
		gap: $layout-horizontal-gap

		padding: $header-padding
		background: $light-gray

		#PRIME-logo img
			width: $prime-logo-size
			margin-right: calc($prime-logo-margin - $layout-horizontal-gap)
			padding-bottom: $prime-logo-alignment

			cursor: pointer

		h1
			color: $purple

			@media screen and (max-width: $phone-width)
				display: none

	main
		display: flex
		flex-flow: column nowrap
		align-items: center

		padding: $main-padding $tudelft-logo-width

		@media screen and (max-width: $phone-width)
			padding: $main-padding
			padding-bottom: $footer-height

	footer
		position: fixed
		bottom: 0

		width: 100vw
		height: $footer-height

		#TUDelft-logo
			width: $tudelft-logo-size
			margin: $tudelft-logo-margin

		@media screen and (max-width: $phone-width)
			background-color: $white

</style>
