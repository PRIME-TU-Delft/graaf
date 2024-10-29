
<script lang="ts">

	// Components
	import IconButton from "../buttons/IconButton.svelte"

	// Assets
	import openEyeIcon from "$assets/open-eye-icon.svg"
	import closedEyeIcon from "$assets/closed-eye-icon.svg"

	// Exports
	export let id: string
	export let value: string = ''
	export let placeholder: string = ''
	export let type: 'text' | 'subtle' | 'obfuscated' = 'text'

	// Main
	let input: HTMLInputElement
	let obfuscated: boolean = true

	function toggle_obfuscation() {
		obfuscated = !obfuscated
		input.type = obfuscated ? "text" : "password"
	}

</script>


<!-- Markup -->


{#if type === 'obfuscated'}

	<div class="textfield">
		<input
			id={id}
			type="password"
			placeholder={placeholder}
			on:change on:input
			bind:this={input}
			bind:value
			/>

		<IconButton 
			src={ obfuscated ? closedEyeIcon : openEyeIcon } 
			description={ obfuscated ? "Hide" : "Show" } 
			on:click={toggle_obfuscation} 
			/>
	</div>

{:else}

	<input
		id={id}
		
		type="text"
		placeholder={placeholder}
		class:subtle={type === 'subtle'}
		class="textfield"
		on:change on:input
		bind:this={input}
		bind:value
		/>

{/if}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *
	
	input
		width: 100%
		padding: $input-thin-padding $input-thick-padding
		box-sizing: border-box

		border: 1px solid $gray
		border-radius: $border-radius

		color: $dark-gray
		cursor: text

		&:focus
			border-color: $tudelft-blue
		
		&.subtle
			border-color: transparent
			transition: border-color $default-transition

			&:hover
				border-color: $gray

	div
		width: 100%
		position: relative

		:global(.icon-button)
			position: absolute
			translate: 0 -50%
			top: 50%
			right: $input-thin-padding

</style>
