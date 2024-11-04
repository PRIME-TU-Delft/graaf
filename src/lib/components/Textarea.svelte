
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
		box-sizing: border-box

		border: 1px solid $gray
		border-radius: $border-radius

		color: $dark-gray
		font-size: 1rem
		resize: vertical

		&:focus
			border-color: $tudelft-blue

		&:not(:read-only)
			cursor: pointer

</style>
