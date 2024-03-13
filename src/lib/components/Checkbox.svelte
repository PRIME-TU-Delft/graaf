
<!-- Script -->

<script lang="ts">

	import Row from "$layouts/RowLayout.svelte";

	export let label: string;
	export let value: boolean = false;

</script>

<!-- Markup -->

<div class="desktop-layout">
	<Row>
		<svelte:fragment slot="right">
			   <input id={label} type="checkbox" value={value} /><!--
			--><label for={label}> {label} </label>
		</svelte:fragment>
	</Row>
</div>
	
<div class="phone-layout">
	<Row>
		<svelte:fragment slot="center">
			   <input id={label} type="checkbox" value={value} /><!--
			--><label for={label}> {label} </label>
		</svelte:fragment>
	</Row>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	input
		margin-right: $input-thin-padding

		accent-color: $purple
		transition: all $default-transition

		&:hover
			cursor: pointer

</style>
