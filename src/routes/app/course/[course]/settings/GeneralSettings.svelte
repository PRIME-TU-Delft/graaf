
<script lang="ts">

	// Internal dependencies
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'
	import type { DropdownOption } from '$scripts/types'

	import type { 
		CourseController,
		ProgramController
	} from '$scripts/controllers'

	// Components
	import Modal from '$components/Modal.svelte'
	import Validation from '$components/Validation.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Searchbar from '$components/Search.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import ProgramRow from './ProgramRow.svelte';
	import { index } from 'd3';

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
			if (this.program === undefined) return
			course.assignProgram(this.program)
			await course.save()
			this.hide()
			update()
		}
	}

	// Exports
	export let course: CourseController
	export let programs: ProgramController[]
	export let program_options: DropdownOption<ProgramController>[] | undefined
	export let update: () => void

	// Modals
	const program_modal = new ProgramModal()

	// Variables
	let query: string = ''

</script>


<!-- Markup -->


<div class="editor">

	<label for="code"> Course Code </label>
	<label for="name"> Course Name </label>

	<Textfield 
		id="code"
		on:input={update}
		on:change={async () => await course.save()}
		bind:value={course.code}
	/>

	<Textfield 
		id="name"
		on:input={update}
		on:change={async () => await course.save()}
		bind:value={course.name}
	/>

	<!-- Toolbar -->
	<div class="programs">
		<div class="toolbar">
			<h2> Programs </h2>
	
			<div class="flex-spacer" />
	
			<Searchbar bind:value={query} />
			<Button on:click={() => program_modal.show()}>
				<img src={plusIcon} alt="Assign to Program"> Assign to Program
			</Button>
		</div>
	

		{#if programs.some(program => program.matchesQuery(query))}
			{#each programs as program, index}
				{#if program.matchesQuery(query)}
					<ProgramRow
						index={index + 1}	
						course={course}
						program={program}
						update={update}
					/>
				{/if}
			{/each}
		{:else}
			<h6 class="grayed"> No programs found </h6>
		{/if}
	</div>
</div>

<Modal bind:this={program_modal.modal}>
	<h3 slot="header"> Assign to Program </h3>
	Assign this course to a program. Programs are collections of courses that are related to each other in some way.

	<form>
		<label for="program"> Target Program </label>

		{#if program_options === undefined}
			<p class="grayed"> Loading... </p>
		{:else}
			<Dropdown
				id="program"
				placeholder="Target Program"
				bind:value={program_modal.program}
				options={program_options}
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
</Modal>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		display: grid
		grid-template: "left right" auto "left right" auto "programs programs" auto / 1fr 1fr
		grid-gap: $form-small-gap

		padding: $card-thick-padding

		.programs
			grid-area: programs

			margin-top: $form-big-gap
			padding: 0 $card-thick-padding

			.toolbar
				display: flex
				margin-bottom: $form-big-gap
				gap: $form-small-gap
			
			.grayed
				margin: auto
				color: $gray

</style>