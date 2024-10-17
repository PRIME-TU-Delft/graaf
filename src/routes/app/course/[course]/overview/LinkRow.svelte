
<script lang="ts">

	// Internal dependencies
	import { CourseController, LinkController } from '$scripts/controllers'

	// Components
	import IconButton from '$components/buttons/IconButton.svelte'
	import Textfield from '$components/forms/Textfield.svelte'
	import Dropdown from '$components/forms/Dropdown.svelte'
	import Button from '$components/buttons/Button.svelte'
	import LinkURL from './LinkURL.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let link: LinkController
	export let course: CourseController
	export let update: () => void

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
		type="subtle"
		placeholder="Link Name"
		bind:value={link.name}
		on:change={async () => {
			await link.save()
			update()
		}}
		/>

	{#await course.getGraphOptions() then options}
		<Dropdown
			label="Graph"
			placeholder="Select a graph"
			options={options}
			bind:value={link.graph_id}
			on:change={async () => {
				await link.save()
				update()
			}}
			/>
	{/await}

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
