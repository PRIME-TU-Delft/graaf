
<script lang="ts">

	// Internal dependencies
	import { course } from './stores'

	import { Validation, Severity } from '$scripts/validation'
	import { AbstractFormModal } from '$scripts/modals'

	import type { ProgramController } from '$scripts/controllers'

	// Components
	import ProgramRow from './ProgramRow.svelte'

	import FormModal from '$components/FormModal.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Dropdown from '$components/Dropdown.svelte'
	import Button from '$components/Button.svelte'
	import Card from '$components/Card.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Modals
	class AddProgramModal extends AbstractFormModal {
		program: ProgramController | null = null

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			if (this.hasChanged('program')) {
				if (this.program === null) {
					validation.add({
						severity: Severity.error,
						short: 'Program is required'
					})
				}
			}

			return validation
		}

		async submit() {
			$course.assignToProgram(this.program as ProgramController)
			await $course.save()
			$course = $course // Trigger reactivity
		}
	}



	// Variables
	const program_modal = new AddProgramModal()
	
	let query: string = ''

	$: filtered_programs = $course.programs.filter(program => program.matchesQuery(query))

</script>

<!-- Markup -->

<FormModal controller={program_modal}>
	<h3 slot="header"> Assign to Program </h3>
	Assign this course to a program. Programs are collections of courses that are related to each other in some way.

	<svelte:fragment slot="form">
		<label for="program"> Target Program </label>
		<Dropdown
			placeholder="Select a program"
			bind:value={program_modal.program}
			options={$course.program_options}
		/>
	</svelte:fragment>

	<svelte:fragment slot="submit">
		Assign
	</svelte:fragment>
</FormModal>

<Card>
	<svelte:fragment slot="header">
		<h3> Programs </h3>

		<div class="flex-spacer" />

		<Searchbar placeholder="Search programs" bind:value={query} />
		<Button on:click={() => program_modal.show()}>
			<img src={plus_icon} alt=""> Assign to program
		</Button>
	</svelte:fragment>

	{#if filtered_programs.length === 0}
		<p class="grayed"> There's nothing here </p>
	{/if}

	{#each filtered_programs as program}
		<ProgramRow {program} />
	{/each}
</Card>
