
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'
	import { ProgramController } from '$scripts/controllers'

	// Components
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'

	// Assets
	import trashIcon from '$assets/trash-icon.svg'

	// Exports
	export let index: number
	export let program: ProgramController
	export let update: () => void

</script>


<!-- Markup -->

{#if $course !== undefined}
	<div class="program-row">
		<IconButton 
			src={trashIcon}
			description="Unassign from program"
			on:click={async () => {
				$course.unassignProgram(program)
				await $course.save()
				update()
			}}
		/>

		<span> {index} </span>
		<span> {program.name} </span>

		<LinkButton href="/app/program/{program.id}/settings">
			Program Settings
		</LinkButton>
	</div>
{/if}


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.program-row
		display: grid
		grid-template: "index name settings delete" auto / $total-icon-size $total-icon-size max-content 1fr
		grid-gap: $form-small-gap
		place-items: center center
		
		padding: 0 $input-thick-padding
		box-sizing: content-box

		color: $dark-gray

		&:not(:last-child)
			border-bottom: 1px solid $gray

		:global(.link-button)
			justify-self: end

</style>