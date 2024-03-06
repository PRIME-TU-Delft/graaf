
<!-- Script -->

<script lang="ts">

	import Card from '$components/Card.svelte';
	import Row from '$components/Row.svelte';
	import Textfield from '$components/RowTextInput.svelte';

	function register(event: Event) {
		// TODO add register event
	}

</script>

<!-- Markup -->

<Card>
	<h3 slot="header"> Register </h3>
	<svelte:fragment slot="body">
		<form>
			<Textfield label="First name" />
			<Textfield label="Last name" />
			<Textfield label="Username" />
			<Textfield label="Password" obfuscate={true} />
			<Textfield label="Confirm password" obfuscate={true} />

			<div class="desktop-layout">
				<Row><button slot="right" class="btn" type="submit" on:click={register}>
					Register
				</button></Row>
			</div>
				
			<div class="phone-layout">
				<Row><button slot="center" class="btn" type="submit" on:click={register}>
					Register
				</button></Row>
			</div>
		</form>
	</svelte:fragment>
</Card>
