
<script lang="ts">

	// Exports
	export let label: string
	export let value: string = ''
	export let placeholder: string = ''
	export let obfuscate: boolean = false

	// Variables
	$: id = label.toLowerCase().replace(/\s/g, '_')

</script>



<!-- Markup -->



{#if obfuscate}

	<input
		{id}
		{placeholder}
		name={id}
		type="password"
		class="textfield"
		bind:value
		/>

{:else}

	<input
		{id}
		{placeholder}
		name={id}
		type="text"
		class="textfield"
		bind:value
		/>

{/if}



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.textfield
		width: 100%
		padding: $input-thin-padding $input-thick-padding
		box-sizing: border-box

		border: 1px solid $gray
		border-radius: $border-radius

		color: $dark-gray
		cursor: text

</style>
