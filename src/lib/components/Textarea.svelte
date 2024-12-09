
<script lang="ts">

	// Exports
	export let id: string
	export let value: string = ''
	export let readonly: boolean = false

</script>


<!-- Markup -->


<textarea 
	id={id} 
	class="textarea"
	bind:value={value} 
	readonly={readonly} 
/>


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
