<!-- Script -->

<script lang="ts">
	import Card from '$components/Card.svelte';
	import Button from '$components/Button.svelte';
	import Textfield from '$components/Textfield.svelte';
</script>

<!-- Markup -->

<Card>
	<h3 slot="header">Register</h3>
	<svelte:fragment slot="body">
		<form>
			<label for="first_name"> First Name </label>
			<Textfield label="First Name" />

			<label for="last_name"> Last Name </label>
			<Textfield label="Last Name" />

			<label for="username"> Username </label>
			<Textfield label="Username" />

			<label for="password"> Password </label>
			<Textfield label="Password" obfuscate />

			<Button submit>Register</Button>
		</form>
	</svelte:fragment>
</Card>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	form
		display: grid
		grid-template: "label content" auto / 1fr 2fr
		place-items: center start

		label
			grid-column: label
			justify-self: end

			margin-top: $form-small-gap
			padding-right: $form-medium-gap

		:global(.textfield)
			grid-column: content
			margin-top: $form-small-gap

		:global(.button)
			grid-column: content
			margin-top: $form-big-gap

		@media screen and (max-width: $phone-breakpoint)
			grid-template: "label" auto "content" auto / 1fr

			:global(.textfield)
				margin-top: 0px
			:global(.button)
				justify-self: center
			label
				justify-self: start

</style>
