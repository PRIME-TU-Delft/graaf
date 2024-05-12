<!-- Script -->

<script lang="ts">
	import Textfield from '$components/Textfield.svelte';

	import { Graph } from './entities';

	export let graph: Graph;
</script>

<!-- Markup -->

<div class="editor">
	<div class="input">
		<label for="name"> Name </label>
		<Textfield label="Name" bind:value={graph.name} />
	</div>
</div>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		display: flex
		flex-flow: row wrap
		place-items: center start
		gap: $form-medium-gap

		padding: $card-thick-padding

		.input
			display: flex
			flex-flow: column nowrap
			flex: 1

</style>
