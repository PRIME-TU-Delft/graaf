
<script lang="ts">

	// External dependencies
	import { SignIn, SignOut } from '@auth/sveltekit/components'
	import { signIn, signOut } from '@auth/sveltekit/client'
	import { page } from '$app/stores'

	// Components
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'

	// Assets
	import PRIME_logo from '$assets/PRIME-logo.svg'
	import TUDelft_logo from '$assets/TUD-logo.svg'

	// Variables
	let logged_in = false // TODO temporary

</script>


<!-- Markup -->


<header>
	<a id="PRIME-logo" href="/app">
		<img src={PRIME_logo} alt="PRIME logo" />
	</a>

	<h1> Graph editor </h1>

	<div class="flex-spacer" />

	{#if logged_in}
		<LinkButton href="app/auth/logout"> Logout </LinkButton>
		<Button href="app/dashboard"> Dashboard </Button>
	{:else}
		<LinkButton href="app/auth/register"> Register </LinkButton>
		<Button on:click={() => signIn("surfconext")}> Login </Button>
	{/if}
</header>

<main>
	<section class="title">
		<slot name="title" />
	</section>

	{#if $$slots.toolbar}
		<section class="toolbar">
			<slot name="toolbar" />
		</section>
	{/if}

	<section class="content">
		<slot />
	</section>
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
		display: flex
		flex-flow: column nowrap
		place-items: stretch start

		box-sizing: content-box
		min-width: $small-column
		max-width: $big-column

		margin: auto
		padding: $main-padding $tudelft-logo-width

		@media screen and (max-width: $phone-breakpoint)
			width: $small-column
			padding: $main-padding
			padding-bottom: $footer-height

		.title
			margin-bottom: 2rem
			color: $dark-gray

		.toolbar
			display: flex
			flex-flow: row nowrap
			place-items: center start
			gap: $form-small-gap

			margin-bottom: 1rem

		.content
			display: flex
			flex-flow: column nowrap
			place-items: stretch start
			gap: 1rem

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
