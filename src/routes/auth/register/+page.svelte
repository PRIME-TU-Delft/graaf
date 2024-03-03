
<!-- Script -->

<script lang="ts">

	import Layout from '$layouts/FormLayout.svelte';

	import Card from '$components/Card.svelte';
	import Row from '$components/Row.svelte';
	import Textfield from '$components/RowTextInput.svelte';

	let innerWidth: number;

	function register(event: Event) {
		// TODO add register event
	}

</script>

<!-- Markup -->

<svelte:window bind:innerWidth />

<Layout>
	<Card>
		<h1 slot="header">Register</h1>
		<svelte:fragment slot="body">
			<form>
				<Textfield label="First name" />
				<Textfield label="Last name" />
				<Textfield label="Username" />
				<Textfield label="Password" obfuscate={true} />
				<Textfield label="Confirm password" obfuscate={true} />

				{#if innerWidth > 600} <!-- NOTE this assumes $phone-width is 600px -->
					<Row><button class="btn" slot="right" type="submit" on:click={register}>
						Register
					</button></Row>
				{:else}
					<Row><button class="btn" slot="center" type="submit" on:click={register}>
						Register
					</button></Row>
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

</style>