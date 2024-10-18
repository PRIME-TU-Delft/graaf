
<script lang="ts">

	// Internal dependencies
	import { DomainController } from '$scripts/controllers'

	// Components
	import IconButton from '$components/buttons/IconButton.svelte'
	import Textfield from '$components/forms/Textfield.svelte'
	import Dropdown from '$components/forms/Dropdown.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let domain: DomainController
	export let update: () => void

</script>


<!-- Markdown -->


<div class="row" id={domain.uuid}>
	{#await domain.validate() then validate}
		<Validation short data={validate} />
	{/await}

	{#await domain.getIndex() then index}
		<span> {index + 1} </span>
	{/await}

	<IconButton scale
		src={trashIcon}
		on:click={async () => {
			await domain.delete()
			update()
		}}
		/>

	<Textfield
		id="name"
		placeholder="Domain Name"
		bind:value={domain.name}
		on:change={async () => {
			await domain.save()
			update()
		}}
		/>

	{#await domain.getStyleOptions() then style_options}
		<Dropdown
			id="style"
			placeholder="Domain Style"
			options={style_options}
			bind:value={domain.style}
			on:change={async () => {
				await domain.save()
				update()
			}}
			/>
	{/await}

	{#await domain.getColor() then color}
		<span class="preview" style:background-color={color} />
	{/await}
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	$icon-width: calc($input-icon-size + 2 * $input-icon-padding)

	.row
		display: grid
		grid-template: "validation id delete left right right-preview" auto / $icon-width $icon-width $icon-width 1fr 1fr $icon-width
		place-items: center center
		gap: $form-small-gap

		padding-right: calc( $form-small-gap + $icon-width )

		.preview
			width: $input-icon-size
			height: $input-icon-size

		.header
			display: flex
			flex-flow: row nowrap
			align-content: center
			justify-content: right
			width: 100%

			span
				flex: 1

</style>