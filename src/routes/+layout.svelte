
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

	{#if loggedIn}
		<a class="link-btn align-right" href="/auth/logout">Logout</a>
		<a class="btn" href="/dashboard">Dashboard</a>
	{:else}
		<a class="link-btn align-right" href="/auth/register">Register</a>
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

	@use "$styles/variables.sass"
	$footer-height: variables.$tudelft-width * 25/64 + 2 * variables.$tudelft-margin

	header
		display: flex
		flex-flow: row nowrap
		align-items: center

		height: 6rem
		padding: 1rem

		background-color: variables.$light-gray

		#PRIME-logo
			height: 100%

			img
				height: 100%
				padding-bottom: 1rem

				&:hover
					cursor: pointer

		h1
			margin-left: 3rem

			font-size: 2.5rem
			color: variables.$purple

			@media screen and (max-width: variables.$phone-width)
				display: none

		.btn
			margin-left: 0.25rem
			padding: 0.375rem 0.75rem

			border: 1px solid transparent
			border-radius: 0.25rem

			color: white
			background-color: variables.$purple
			transition: all 0.15s ease-in-out

			&:hover
				cursor: pointer
				background-color: variables.$dark-purple

		.link-btn
			padding: 0.375rem 0.75rem

			color: variables.$purple
			transition: all 0.15s ease-in-out

			&:hover
				cursor: pointer
				color: variables.$dark-purple
				text-decoration: underline

		.align-right
			margin-left: auto

	main
		display: flex
		flex-flow: column nowrap
		align-items: center

		width: 100vw
		padding: variables.$main-padding calc(variables.$tudelft-width + 2 * variables.$tudelft-margin) $footer-height

		@media screen and (max-width: variables.$phone-width)
			padding: variables.$main-padding variables.$main-padding $footer-height

	footer
		position: fixed
		bottom: 0

		width: 100vw
		height: $footer-height

		#TUDelft-logo
			width: variables.$tudelft-width
			margin: variables.$tudelft-margin

		@media screen and (max-width: variables.$phone-width)
			background-color: variables.$white

</style>
