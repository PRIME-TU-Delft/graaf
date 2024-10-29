

<script lang="ts">

	import Button from '$components/buttons/Button.svelte';
	import LinkButton from '$components/buttons/LinkButton.svelte';

	// Auth
	import { SignIn, SignOut } from '@auth/sveltekit/components';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';

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
		<Button on:click={() => signIn("surfconext")}> Login </Button>
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

	main
		box-sizing: content-box
		min-width: $small-column
		max-width: $big-column

		margin: auto
		padding: $main-padding $tudelft-logo-width

		@media screen and (max-width: $phone-breakpoint)
			width: $small-column
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
			pointer-events: auto

</style>
