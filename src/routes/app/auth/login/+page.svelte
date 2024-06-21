<!-- Script -->

<script lang="ts">
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';
	import Checkbox from '$components/Checkbox.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import Textfield from '$components/Textfield.svelte';

	function SSOlogin() {
		// TODO add SSO login event
	}
</script>

<!-- Markup -->

<Card>
	<h3 slot="header">Login</h3>
	<svelte:fragment slot="body">
		<form class="SSO-login">
			Welcome to the Graph editor, here you can assemble your own course graph! From July 1 forward
			we will be using TU Delft Single Sign-on as our default login procedure. The old accounts will
			be removed after November 1. You can give yourself access to the courses that your old account
			had access to. Please take up contact with PRIME@tudelft.nl or your program manager to handle
			access to other courses.
			<Button on:click={SSOlogin}>Login with TUDelft SSO</Button>
		</form>

		<div class="divider" />

		<form class="credentials-login">
			<label for="username"> Username </label>
			<Textfield label="Username" />

			<label for="password"> Password </label>
			<Textfield label="Password" obfuscate />

			<Checkbox label="Remember me" />

			<div class="button-row">
				<Button submit>Login</Button><!--
				--><LinkButton href="/auth/recover">
					Forgot your password?
				</LinkButton>
			</div>
		</form>
	</svelte:fragment>
</Card>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.SSO-login
		display: flex
		flex-flow: column nowrap
		place-items: center start
		gap: $form-big-gap

	.credentials-login
		display: grid
		grid-template: "label content" auto / 1fr 2fr
		place-items: center start

		label
			grid-column: label
			justify-self: end

			margin-top: $form-small-gap
			padding-right: $form-medium-gap

		:global(.textfield), :global(.checkbox)
			grid-column: content
			margin-top: $form-small-gap

		.button-row
			grid-column: content
			margin-top: $form-big-gap

			display: inline-flex
			flex-flow: row nowrap
			gap: $form-small-gap

		@media screen and (max-width: $phone-breakpoint)
			grid-template: "label" auto "content" auto / 1fr

			:global(.textfield)
				margin-top: 0px
			label
				justify-self: start
			.button-row
				justify-self: center

	.divider
		height: 1px
		margin: $form-big-gap 0

		background-color: $gray

</style>
