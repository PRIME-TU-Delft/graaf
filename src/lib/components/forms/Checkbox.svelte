
<script lang="ts">

	// Exports
	export let label: string;
	export let value: boolean = false;

	// Variables
	$: id = label.toLowerCase().replace(/\s/g, '_');

</script>


<!-- Markup -->


<div class="checkbox">
	<input {id} type="checkbox" bind:value /><!--
	--><label for={id}> {label} </label>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.checkbox
		display: inline-flex
		flex-flow: row nowrap
		align-items: center

		input
			cursor: pointer
			accent-color: $purple
			transition: all $default-transition

		label
			padding-left: 0.5em

</style>
