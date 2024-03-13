
<!-- Script -->

<script lang="ts">

	import Card from '$components/Card.svelte';
	import Row from '$layouts/RowLayout.svelte';
	import Button from '$components/Button.svelte';
	import Textfield from '$components/Textfield.svelte';

	function register() {
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
				<Row><svelte:fragment slot="right">
					<Button callback={register}> Register </Button>
				</svelte:fragment></Row>
			</div>
				
			<div class="phone-layout">
				<Row><svelte:fragment slot="center">
					<Button callback={register}> Register </Button>
				</svelte:fragment></Row>
			</div>
		</form>
	</svelte:fragment>
</Card>
