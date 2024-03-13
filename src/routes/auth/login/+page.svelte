
<!-- Script -->

<script lang="ts">
	
	import Card from '$components/Card.svelte';
	import Row from '$layouts/RowLayout.svelte';
	import Button from '$components/Button.svelte';
	import LinkButton from '$components/LinkButton.svelte';

	import Textfield from '$components/Textfield.svelte';
	import Checkbox from '$components/Checkbox.svelte';

	function SSOlogin() {
		// TODO add SSO login event
	}

	function login() {
		// TODO add login event
	}

</script>

<!-- Markup -->

<Card>
	<h3 slot="header"> Login </h3>
	<svelte:fragment slot="body">
		<form>
			<Row><svelte:fragment slot="center"> 
				Welcome to the Graph editor, here you can assemble your own course graph! From July 1 forward we will be using TU Delft Single Sign-on as our default login procedure. The old accounts will be removed after November 1. You can give yourself access to the courses that your old account had access to. Please take up contact with PRIME@tudelft.nl or your program manager to handle access to other courses.
			</svelte:fragment></Row>

			<Row><svelte:fragment slot="center"> 
				<Button callback={SSOlogin}> Login with TUDelft SSO </Button>
			</svelte:fragment></Row>
		</form>

		<div class="divider" />

		<form>
			<Textfield label="Username" />
			<Textfield label="Password" obfuscate={true} />
			<Checkbox  label="Remember me" />

			<div class="desktop-layout">
				<Row>
					<svelte:fragment slot="right">
						<Button callback={login}> Login </Button>
						<LinkButton href="/auth/recover"> Forgot your password? </LinkButton>
					</svelte:fragment>
				</Row>
			</div>
			
			<div class="phone-layout">
				<Row>
					<svelte:fragment slot="center">
						<button class="btn" type="submit" on:click={login}> Login </button>
						<a class="link-btn" href="/auth/recover"> Forgot your password? </a>
					</svelte:fragment>
				</Row>
			</div>
		</form>
	</svelte:fragment>
</Card>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.divider
		height: 1px
		margin: calc($card-divider-height / 2) 0

		background-color: $gray

</style>