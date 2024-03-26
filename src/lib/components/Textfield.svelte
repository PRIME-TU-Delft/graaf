
<!-- Script -->

<script lang="ts">

	import Row from "$layouts/RowLayout.svelte";

	export let label: string;
	export let placeholder: string = "";
	export let obfuscate: boolean = false;

	$: id = label.toLowerCase().replace(/\s/g, "_");

</script>

<!-- Markup -->

<div class="desktop-layout">
	<Row>
		<label slot="left" for={id}>{label}</label><!--
		--><input slot="right" id={id} name={id} type={obfuscate ? "password" : "text"} placeholder={placeholder} />
	</Row>
</div>
	
<div class="phone-layout">
	<Row>
		<svelte:fragment slot="center">
			<label for={id}>{label}</label><!--
			--><input id={id} name={id} type={obfuscate ? "password" : "text"} placeholder={placeholder} />
		</svelte:fragment>
	</Row>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	label
		display: block
		padding: calc($input-thin-padding + 1px) calc($input-thick-padding + 1px)
		
		text-align: right

		@media screen and (max-width: $phone-width)
			width: 100%
			padding: 0
			
			text-align: left

	input
		width: 100%
		padding: $input-thin-padding $input-thick-padding

		border: 1px solid $gray
		border-radius: $border-radius

		color: $dark-gray

		&:hover
			cursor: text

</style>
