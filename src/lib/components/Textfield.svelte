
<!-- Script -->

<script lang="ts">

	export let id: string;
	export let placeholder: string = "";
	export let obfuscate: boolean = false;

</script>

<!-- Markup -->

<input id={ id } name={ id } type={obfuscate ? "password" : "text"} placeholder={placeholder} />

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
