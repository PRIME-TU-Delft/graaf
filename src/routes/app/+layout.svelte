<!-- Script -->

<script lang="ts">
	import Button from '$components/Button.svelte';
	import LinkButton from '$components/LinkButton.svelte';

	import PRIME_logo from '$assets/PRIME-logo.svg';
	import TUDelft_logo from '$assets/TUD-logo.svg';

	let loggedIn = false; // TODO temporary
</script>

<!-- Markup -->

<header>
	<a id="PRIME-logo" href="/app">
		<img src={PRIME_logo} alt="PRIME logo" />
	</a>

	<h1> Graph editor </h1>

	<div class="flex-spacer" />

	{#if loggedIn}
		<LinkButton href="app/auth/logout"> Logout </LinkButton>
		<Button href="app/dashboard"> Dashboard </Button>
	{:else}
		<LinkButton href="app/auth/register"> Register </LinkButton>
		<Button href="app/auth/login"> Login </Button>
	{/if}
</header>

<main>
	<slot />
</main>

<footer>
	<img id="TUDelft-logo" src={TUDelft_logo} alt="TUDelft logo" />
</footer>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	header
		display: flex
		flex-flow: row nowrap
		place-items: center start
		gap: $form-small-gap

		padding: $header-padding
		background: $light-gray

		#PRIME-logo img
			width: $prime-logo-size
			margin-right: calc($prime-logo-margin - $form-small-gap)
			padding-bottom: $prime-logo-alignment

			cursor: pointer

		h1
			color: $purple

			@media screen and (max-width: $phone-breakpoint)
				display: none

	main
		display: flex
		flex-flow: column nowrap
		place-items: center start

		padding: $main-padding $tudelft-logo-width

		@media screen and (max-width: $phone-breakpoint)
			padding: $main-padding
			padding-bottom: $footer-height

	footer
		position: fixed
		bottom: 0

		width: 100vw
		height: $footer-height

		pointer-events: none

		#TUDelft-logo
			width: $tudelft-logo-size
			margin: $tudelft-logo-margin

		@media screen and (max-width: $phone-breakpoint)
			background-color: $white

</style>
