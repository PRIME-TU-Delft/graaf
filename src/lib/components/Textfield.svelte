
<script lang="ts">

	// Components
	import IconButton from "$components/IconButton.svelte"

	// Assets
	import openEyeIcon from "$assets/open-eye-icon.svg"
	import closedEyeIcon from "$assets/closed-eye-icon.svg"

	// Exports
	export let id: string
	export let placeholder: string = ''
	export let type: 'text' | 'number' | 'obfuscated' = 'text'
	export let value: string | number = type === 'number' ? 0 : ''

	// Functions
	function toggle_obfuscation() {
		obfuscated = !obfuscated
		input.type = obfuscated ? "text" : "password"
	}

	// Main
	let input: HTMLInputElement
	let obfuscated: boolean = true

	$: if (type === 'number') {
		value = Number(value)
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

{:else if type === 'number'}

	<input
		id={id}
		type="number"
		placeholder={placeholder}
		class="textfield"
		on:change on:input
		bind:value
	/>

{:else}

	<input
		id={id}
		type="text"
		placeholder={placeholder}
		class="textfield"
		on:change on:input
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
		border-radius: $default-border-radius

		color: $dark-gray
		background: $white
		cursor: text

		&:focus
			outline: $default-outline
			border-color: $white

	div
		position: relative
		width: 100%

		:global(.icon-button)
			position: absolute
			translate: 0 -50%
			top: 50%
			right: $input-thin-padding

</style>
