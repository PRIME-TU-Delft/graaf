
<script lang="ts">

	// External dependencies
	import { goto } from '$app/navigation'

	// Internal dependencies
	import { course, programs, program_options } from './stores'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	import type { ProgramController} from '$scripts/controllers'

	// Components
	import ProgramRow from './ProgramRow.svelte'

	import Validation from '$components/Validation.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Searchbar from '$components/Search.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'

	// Assets
	import trash_icon from '$assets/trash-icon.svg'
	import plus_icon from '$assets/plus-icon.svg'

	// Helpers
	class ProgramModal extends BaseModal {
		program?: ProgramController

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()
		
			if (this.program === undefined) {
				result.add({
					severity: Severity.error,
					short: 'Program is required'
				})
			}
		
			return result
		}

		async submit() {
			if ($course === undefined || this.program === undefined) return
			$course.assignProgram(this.program)
			await $course.save()
			this.hide()
			update()
		}
	}

	// Exports
	export let update: () => void

	// Modals
	let archive_modal: Modal
	const program_modal = new ProgramModal()

	// Variables
	let query: string = ''

</script>


<!-- Markup -->


<div class="editor">
	{#if $course === undefined || $programs === undefined}
		<p class="grayed"> Loading... </p>
	{:else}
		<label for="code"> Course Code </label>
		<label for="name"> Course Name </label>

		<Textfield 
			id="code"
			on:input={update}
			on:change={async () => await $course.save()}
			bind:value={$course.code}
		/>

		<Textfield 
			id="name"
			on:input={update}
			on:change={async () => await $course.save()}
			bind:value={$course.name}
		/>

		<div class="button-row">
			<Button dangerous on:click={() => archive_modal.show()}>
				<img src={trash_icon} alt="" /> Archive Course
			</Button>
		</div>

		<!-- Toolbar -->
		<div class="programs">
			<div class="toolbar">
				<h2> Programs </h2>
			
				<div class="flex-spacer" />
			
				<Searchbar placeholder="Search programs" bind:value={query} />
				<Button on:click={() => program_modal.show()}>
					<img src={plus_icon} alt="Assign to Program"> Assign to Program
				</Button>
			</div>
		

			{#if $programs.some(program => program.matchesQuery(query))}
				{#each $programs as program, index}
					{#if program.matchesQuery(query)}
						<ProgramRow
							index={index + 1}
							program={program}
							update={update}
						/>
					{/if}
				{/each}
			{:else}
				<h6 class="grayed"> No programs found </h6>
			{/if}
		</div>
	{/if}
</div>

<Modal bind:this={archive_modal}>
	<h3 slot="header"> Archive Course </h3>
	When you archive a course, it, and all associated graphs and links will no longer be visible to anyone except program administrators. Only they can restore them.

	<svelte:fragment slot="footer">
		<LinkButton on:click={() => archive_modal.hide()}> Cancel </LinkButton>
		<Button on:click={async () => {
			await $course?.delete() // TODO this should archive, not delete. Implement this
			goto('/app/dashboard')
		}}> Archive </Button>
	</svelte:fragment>
</Modal>

<Modal bind:this={program_modal.modal}>
	<h3 slot="header"> Assign to Program </h3>
	Assign this course to a program. Programs are collections of courses that are related to each other in some way.

	{#if $program_options === undefined}
		<p class="grayed"> Loading... </p>
	{:else}
		<form>
			<label for="program"> Target Program </label>

			{#if program_options === undefined}
				<p class="grayed"> Loading... </p>
			{:else}
				<Dropdown
					id="program"
					placeholder="Target Program"
					bind:value={program_modal.program}
					options={$program_options}
				/>
			{/if}

			<footer>
				<Button
					disabled={!program_modal.validate().okay()}
					on:click={() => program_modal.submit()}
				> Assign </Button>
				<Validation data={program_modal.validate()} />
			</footer>
		</form>
	{/if}
</Modal>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		display: grid
		grid-template: "left right" auto "left right" auto "button-row button-row" auto "programs programs" auto / 1fr 1fr
		grid-gap: $form-small-gap

		padding: $card-thick-padding

		.button-row
			grid-area: button-row
			justify-self: end

		.programs
			grid-area: programs

			margin-top: $form-big-gap
			padding: 0 $card-thick-padding

			.toolbar
				display: flex
				margin-bottom: $form-big-gap
				gap: $form-small-gap

</style>