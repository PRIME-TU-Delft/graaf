
<script lang="ts">

	// External dependencies
	import type { PageData } from './$types'

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import { programs, courses, query } from './stores'
	import { handleError } from '$scripts/utility'

	import { Validation, Severity } from '$scripts/validation'
	import { AbstractFormModal } from '$scripts/modals'

	import {
		ControllerCache,
		ProgramController,
		CourseController,
		UserController
	} from '$scripts/controllers'

	// Components
	import CoursesCard from './CoursesCard.svelte'
	import ProgramCard from './ProgramCard.svelte'

	import FormModal from '$components/FormModal.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Loading from '$components/Loading.svelte'
	import Layout from '$components/Layout.svelte'
	import Navbar from '$components/Navbar.svelte'
	import Button from '$components/Button.svelte'

	// Assets
	import plus_icon from '$assets/plus-icon.svg'

	// Modals
	class ProgramModal extends AbstractFormModal {
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			// Validate name
			if (this.hasChanged('name')) {
				if (this.name.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Program name is required'
					})
				} else if (this.name.trim().length > settings.MAX_PROGRAM_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Program name is too long'
					})
				} else if ($programs.some(program => program.trimmed_name === this.name.trim())) {
					validation.add({
						severity: Severity.error,
						short: 'Program name isn\'t unique'
					})
				}
			}

			return validation
		}

		async submit() {
			try {
				const program = await ProgramController.create(cache, this.name.trim())
				$programs = [...$programs, program] // Trigger reactivity
			} catch (error) {
				handleError(error)
			}
		}
	}

	// Functions
	async function revive() {
		
		// Await all promises
		const [
			awaited_courses,
			awaited_programs,
			awaited_admins
		] = await Promise.all([
			data.courses,
			data.programs,
			data.admins
		])

		// Revive controllers into stores
		programs.set(awaited_programs.map(program => ProgramController.revive(cache, program)))
		courses.set(awaited_courses.map(course => CourseController.revive(cache, course)))
		
		// Revive controllers into cache
		awaited_admins.forEach(admin => UserController.revive(cache, admin))
	}

	// Main
	export let data: PageData

	const cache = new ControllerCache()
	const program_modal = new ProgramModal()

</script>

<!-- Markup -->

<FormModal controller={program_modal}>
	<h3 slot="header"> Create Program </h3>

	Programs are collections of Courses, usually pertaining to the same field of study. Looking to try out the Graph editor? Try making a sandbox environment instead!

	<svelte:fragment slot="form">
		<label for="name"> Program Name </label>
		<Textfield id="name" bind:value={program_modal.name} />
	</svelte:fragment>

	<svelte:fragment slot="submit"> Create </svelte:fragment>
</FormModal>

{#await revive()}
	<Loading />
{:then} 
	<Layout>
		<svelte:fragment slot="title">
			<Navbar path={[{ name: 'Home' }]} />
			Here you can find all Programs and associated Courses. Click on any of them to edit or view
			more information. You can also create a sandbox environment to experiment with the Graph Editor. Can't find a specific
			Program or Course? Maybe you don't have access to it. Contact one of its Admins to get access.
		</svelte:fragment>

		<svelte:fragment slot="toolbar">
			<Button on:click={() => program_modal.show()}>
				<img src={plus_icon} alt="" /> New Program
			</Button>

			<Button on:click={async () => {
				try {
					const course = await CourseController.create(cache, 'SANDBOX', 'username') // TODO - Implement sandbox flag and username
					$courses = [...$courses, course] // Trigger reactivity
				} catch (error) {
					handleError(error)
				}
			}}>
				<img src={plus_icon} alt="" /> New Sandbox
			</Button>

			<div class="flex-spacer" />

			<Searchbar placeholder="Search courses" bind:value={$query} />
		</svelte:fragment>

		<CoursesCard />

		{#each $programs as program}
			<ProgramCard {program} />
		{/each}
	</Layout>
{/await}