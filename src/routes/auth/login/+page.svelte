
<!-- Script -->

<script lang="ts">

	import Layout from '$lib/layouts/FormLayout.svelte';
	
	import Card from '$components/Card.svelte';
	import Row from '$components/Row.svelte';
	import TextInput from '$components/RowTextInput.svelte';
	import Checkbox from '$components/RowCheckbox.svelte';

	let innerWidth: number;

	function SSOlogin(event: Event) {
		// TODO add SSO login event
	}

	function login(event: Event) {
		// TODO add login event
	}

</script>

<!-- Markup -->

<svelte:window bind:innerWidth />

<Layout>
	<Card>
		<h1 slot="header">Login</h1>
		<svelte:fragment slot="body">
			<form>
				<Row><svelte:fragment slot="center"> 
					Welcome to the Graph editor, here you can assemble your own course graph! From July 1 forward we will be using TU Delft Single Sign-on as our default login procedure. The old accounts will be removed after November 1. You can give yourself access to the courses that your old account had access to. Please take up contact with PRIME@tudelft.nl or your program manager to handle access to other courses.
				</svelte:fragment></Row>
				<Row><button class="btn" slot="center" type="submit" on:click={SSOlogin}> 
					Login with TUDelft SSO
				</button></Row>
			</form>

			<div class="divider" />

			<form>
				<TextInput label="Username" />
				<TextInput label="Password" obfuscate={true} />
				<Checkbox  label="Remember me" />

				{#if innerWidth > 600} <!-- NOTE this assumes $phone-width is 600px -->
					<Row>
						<svelte:fragment slot="right">
							<button class="btn" type="submit" on:click={login}>Login</button>
							<a class="link-btn"  href="/auth/recover">Forgot your password?</a>
						</svelte:fragment>
					</Row>
				{:else}
					<Row>
						<svelte:fragment slot="center">
							<button class="btn" type="submit" on:click={login}>Login</button>
							<a class="link-btn" href="/auth/recover">Forgot your password?</a>
						</svelte:fragment>
					</Row>
				{/if}
			</form>
		</svelte:fragment>
	</Card>
</Layout>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	form
		display: flex
		flex-flow: column nowrap
		align-items: center
		gap: 1rem

	.divider
		height: 1px
		margin: 50px 0
		background-color: variables.$gray

</style>