
<script lang="ts">

	// Internal dependencies
	import { GraphController, LinkController } from '$scripts/controllers'
	import type { DropdownOption } from '$scripts/types'

	// Components
	import Textfield from '$components/forms/Textfield.svelte'
	import Dropdown from '$components/forms/Dropdown.svelte'
	import Button from '$components/buttons/Button.svelte'
	import IconButton from '$components/buttons/IconButton.svelte'
	import LinkURL from './LinkURL.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let link: LinkController
	export let graph_options: DropdownOption<GraphController>[]
	export let update: () => void

	$: graphID_options = graph_options.map(option => {
		return {
			value: option.value.id,
			label: option.label,
			validation: option.validation
		}
	})

</script>


<!-- Markup -->


<div class="link-row">
	<IconButton scale
		src={trashIcon}
		description="Delete Link"
		on:click={async () => {
			await link.delete()
			update()
		}}
	/>

	<Textfield
		id="link-name"
		placeholder="Link Name"
		bind:value={link.name}
		on:input={() => update()}
		on:change={async () => await link.save()}
	/>

	<Dropdown
		id="graph"
		placeholder="Select a graph"
		options={graphID_options}
		bind:value={link.graph_id}
		on:change={async () => {
			await link.save()
			update()
		}}
	/>

	<LinkURL link={link} />

	<Button> <b>&lt;/&gt;</b> </Button>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.link-row
		display: grid
		grid-template: "delete name graph url embed" auto / $total-icon-size 1fr 1fr max-content max-content
		grid-gap: $form-small-gap
		align-items: center

		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray

		&:not(:last-child)
			border-bottom: 1px solid $gray

</style>
