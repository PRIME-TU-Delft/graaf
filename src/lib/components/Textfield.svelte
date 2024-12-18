<script lang="ts">
	// Components
	import IconButton from '$components/IconButton.svelte';

	// Assets
	import openEyeIcon from '$assets/open-eye-icon.svg';
	import closedEyeIcon from '$assets/closed-eye-icon.svg';

	interface Props {
		// Exports
		id: string;
		placeholder?: string;
		type?: 'text' | 'number' | 'obfuscated';
		value?: string | number;
		onchange?: (event: Event) => void;
		oninput?: (event: Event) => void;
	}

	let {
		id,
		placeholder = '',
		type = 'text',
		value = $bindable(type === 'number' ? 0 : ''),
		onchange = () => {},
		oninput = () => {}
	}: Props = $props();

	// Functions
	function toggle_obfuscation() {
		obfuscated = !obfuscated;

		if (input) {
			input.type = obfuscated ? 'text' : 'password';
		}
	}

	// Main
	let input = $state<HTMLInputElement>();
	let obfuscated: boolean = $state(true);

	$effect(() => {
		if (type === 'number') {
			value = Number(value);
		}
	});
</script>

<!-- Markup -->

{#if type === 'obfuscated'}
	<div class="textfield">
		<input {id} type="password" {placeholder} {onchange} {oninput} bind:this={input} bind:value />

		<IconButton
			src={obfuscated ? closedEyeIcon : openEyeIcon}
			description={obfuscated ? 'Hide' : 'Show'}
			onclick={toggle_obfuscation}
		/>
	</div>
{:else if type === 'number'}
	<input {id} type="number" {placeholder} class="textfield" {onchange} {oninput} bind:value />
{:else}
	<input {id} type="text" {placeholder} class="textfield" {onchange} {oninput} bind:value />
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
