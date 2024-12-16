<script lang="ts">
	interface Props {
		header?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { header, children }: Props = $props();
</script>


<div class="card">
	<header class="header">{@render header?.()}</header>
	<section class="body">{@render children?.()}</section>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.card
		display: flex
		flex-flow: column nowrap
		align-items: stretch

		border: 1px solid $gray
		border-radius: $default-border-radius

		.header
			display: flex
			flex-flow: row nowrap
			align-items: center
			gap: $form-small-gap

			padding: $card-thin-padding $card-thick-padding

			background-color: $light-gray
			border-bottom: 1px solid $gray
			border-radius: calc($default-border-radius - 1px) calc($default-border-radius - 1px) 0 0

		.body
			display: flex
			flex-flow: column nowrap

			padding: $card-thick-padding

			background-color: $white
			border-radius: 0 0 calc($default-border-radius - 1px) calc($default-border-radius - 1px)

</style>
