
<!-- Script -->

<script lang="ts">

	export let label: string;
	export let value: string = "";
	export let placeholder: string = "";
	export let obfuscate: boolean = false;

	$: id = label.toLowerCase().replace(/\s/g, "_");

</script>

<!-- Markup -->

{#if obfuscate}
	<input id={id} name={id} type="password" class="textfield" placeholder={placeholder} bind:value />
{:else}
	<input id={id} name={id} type="text" class="textfield" placeholder={placeholder} bind:value />
{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	input
		width: 100%
		padding: $input-thin-padding $input-thick-padding
		box-sizing: border-box

		border: 1px solid $gray
		border-radius: $border-radius

		color: $dark-gray
		cursor: text

</style>
