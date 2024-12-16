<script lang="ts">
	interface Props {
		// Exports
		id: string;
		value?: string;
		readonly?: boolean;
	}

	let { id, value = $bindable(''), readonly = false }: Props = $props();
</script>

<!-- Markup -->

<textarea {id} class="textarea" bind:value {readonly}></textarea>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.textarea
		width: 100%
		height: 100px
		padding: $input-thin-padding $input-thick-padding

		border: 1px solid $gray
		border-radius: $default-border-radius

		font-size: 1rem
		color: $dark-gray
		background: $white

		cursor: text
		resize: vertical

		&:focus
			outline: $default-outline
			border-color: $white

</style>
