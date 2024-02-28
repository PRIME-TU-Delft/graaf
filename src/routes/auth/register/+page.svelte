
<!-- Script -->

<script lang="ts">

	import Card from '$components/Card.svelte';
	import Form from '$components/forms/Form.svelte';
	import Row from '$components/forms/Row.svelte';
	import Textfield from '$components/forms/TextInput.svelte';

	let innerWidth: number;

	function register(event: Event) {
		// TODO add register event
	}

</script>

<!-- Markup -->

<svelte:window bind:innerWidth />

<div class="register-card">
	<Card>
		<h1 slot="header">Register</h1>
		<div slot="body">
			<Form>
				<Textfield label="First name" />
				<Textfield label="Last name" />
				<Textfield label="Username" />
				<Textfield label="Password" obfuscate={true} />
				<Textfield label="Confirm password" obfuscate={true} />

				{#if innerWidth > 600} <!-- NOTE this assumes $phone-width is 600px -->
					<Row><button slot="right" type="submit" on:click={register}>Register</button></Row>
				{:else}
					<Row><button slot="center" type="submit" on:click={register}>Register</button></Row>
				{/if}
			</Form>
		</div>
	</Card>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.register-card
		width: 100%
		max-width: variables.$small-column

		button
			padding: 0.375rem 0.75rem
	
			border: 1px solid transparent
			border-radius: 0.25rem
	
			color: white
			background-color: variables.$purple
			transition: all 0.15s ease-in-out
	
			&:hover
				cursor: pointer
				background-color: variables.$dark-purple

</style>
