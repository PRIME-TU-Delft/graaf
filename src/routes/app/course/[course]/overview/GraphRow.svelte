
<script lang="ts">

	// Internal dependencies
	import { CourseController, GraphController } from '$scripts/controllers'

	// Components
	import IconButton from '$components/buttons/IconButton.svelte'
	import Textfield from '$components/forms/Textfield.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'
	import copyIcon from '$assets/copy-icon.svg'
	import openEyeIcon from '$assets/open-eye-icon.svg'
	import closedEyeIcon from '$assets/closed-eye-icon.svg'
	import pencilIcon from '$assets/pencil-icon.svg'
	import linkIcon from '$assets/link-icon.svg'

	// Exports
	export let graph: GraphController
	export let course: CourseController
	export let update: () => void

</script>


<!-- Markup -->


<div class="graph-row">
	{#if graph.link_ids.length > 0}
		<img src={linkIcon} alt="Link icon" class="link-icon" />
	{:else}
		<div />
	{/if}

	<Textfield
		id="graph-name"
		type="subtle"
		placeholder="Graph Name"
		bind:value={graph.name}
		on:change={async () => {
			await graph.save()
			update()
		}}
		/>

	<!-- TODO graph.isVisible() -->
	<IconButton scale
		disabled={false}
		src={true ? openEyeIcon : closedEyeIcon}
		description="View Graph"
	/>

	<IconButton scale
		src={pencilIcon}
		description="Edit Graph"
		href="/app/course/{course.id}/graph/{graph.id}/settings"
	/>

	<IconButton scale src={copyIcon} description="Copy Graph" />

	<IconButton scale
		src={trashIcon}
		description="Delete Graph"
		on:click={async () => {
			await graph.delete()
			update()
		}}
		/>
</div>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.graph-row
		display: grid
		grid-template: "link name view edit copy delete" auto / $total-icon-size 1fr $input-icon-size $input-icon-size $input-icon-size $input-icon-size
		grid-gap: $form-small-gap
		align-items: center

		padding: $input-thin-padding $input-thick-padding

		color: $dark-gray

		&:not(:last-child)
			border-bottom: 1px solid $gray

		.link-icon
			width: $input-icon-size
			filter: $dark-purple-filter

</style>