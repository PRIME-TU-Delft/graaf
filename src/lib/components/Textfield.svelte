
<script lang="ts">

	// Components
	import IconButton from "./IconButton.svelte"

	// Assets
	import openEye from "$assets/open-eye-icon.svg"
	import closedEye from "$assets/closed-eye-icon.svg"

	// Exports
	export let label: string
	export let value: string = ''
	export let placeholder: string = ''
	export let obfuscate: boolean = false

	// Variables
	const id: string = label.toLowerCase().replace(/\s/g, '_')
	let show: boolean = false

	function toggle_obfuscation() {
		show = !show
		document.querySelector<HTMLInputElement>(`#${id}`)!.type = show ? "text" : "password"
	}

</script>


<!-- Markup -->


{#if obfuscate}

	<div class="textfield">
		<input
			id={id}
			name={id}
			type="password"
			placeholder={placeholder}
			on:change on:input
			bind:value
			/>

		<IconButton 
			src={ show ? closedEye : openEye } 
			description={ show ? "Hide" : "Show" } 
			on:click={toggle_obfuscation} 
			/>
	</div>

{:else}

	<input
		id={id}
		name={id}
		placeholder={placeholder}
		type="text"
		class="textfield"
		bind:value
		on:change on:input
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
	
	div
		width: 100%
		position: relative

		:global(.icon-button)
			position: absolute
			translate: 0 -50%
			top: 50%
			right: $input-thin-padding

</style>
