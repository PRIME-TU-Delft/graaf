
<!-- Script -->

<script lang="ts">

	import Row from "$components/forms/Row.svelte";

	export let label: string;
	export let placeholder: string = "";
	export let obfuscate: boolean = false;

	let innerWidth: number;

</script>

<!-- Markup -->

<svelte:window bind:innerWidth />

{#if innerWidth > 600}  <!-- NOTE this assumes $phone-width is 600px -->
	<Row>
		<label slot="left" for={label}>{label}</label>
		<input slot="right" id={label} type={obfuscate ? "password" : "text"} placeholder={placeholder} />
	</Row>
{:else}
	<Row>
		<div slot="center" class="grow">
			<label for={label}>{label}</label>
			<input id={label} type={obfuscate ? "password" : "text"} placeholder={placeholder} />
		</div>
	</Row>
{/if}

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass"

	.grow
		width: 100%

	label
		display: block
		padding: calc(0.375rem + 1px) calc(0.75rem + 16px)
		text-align: right

		@media screen and (max-width: variables.$phone-width)
			padding: 0
			text-align: left

	input
		width: 100%
		padding: 0.375rem 0.75rem

		border: 1px solid variables.$gray
		border-radius: .25rem

		color: variables.$dark-gray
		transition: all 0.15s ease-in-out

		&:hover
			cursor: text


</style>
