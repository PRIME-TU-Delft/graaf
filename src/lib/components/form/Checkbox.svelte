
<!-- Script -->

<script lang="ts">
	
	export let label: string;
	export let value: boolean = false;

	$: id = label.toLowerCase().replace(/\s/g, "_");

</script>

<!-- Markup -->

<div class="checkbox">
	<input id={id} type="checkbox" value={value} /><!--
	--><label for={id}> {label} </label>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.checkbox
		display: grid
		grid-template: ". input label" auto / 33% min-content auto
		justify-items: start

		width: 100%

		input
			grid-area: input

			cursor: pointer
			accent-color: $purple
			transition: all $default-transition

		label
			grid-area: label
			padding-left: $input-label-gap

		@media screen and (max-width: $phone-breakpoint)
			grid-template: "content" auto / 1fr
			justify-items: center

</style>