
<script lang="ts">

	// Internal dependencies
	import * as settings from '$scripts/settings'
	import { course } from './stores'

	import { Validation, Severity } from '$scripts/validation'
	import { FormModal } from '$scripts/modals'

	import {
		GraphController
	} from '$scripts/controllers'

	// Components
	import GraphRow from './GraphRow.svelte'

	import Textfield from '$components/Textfield.svelte'
	import Searchbar from '$components/Searchbar.svelte'
	import Feedback from '$components/Feedback.svelte'
	import Button from '$components/Button.svelte'
	import Modal from '$components/Modal.svelte'
	import Card from '$components/Card.svelte'

    // Assets
	import plus_icon from '$assets/plus-icon.svg'

    // Helpers
	class GraphModal extends FormModal {
		name: string = ''
		
		get trimmed_name() {
			return this.name.trim()
		}

		constructor() {
			super()
			this.initialize()
		}

		validate(): Validation {
			const validation = new Validation()

			if (this.hasChanged('name')) {
				if (this.trimmed_name === '') {
					validation.add({
						severity: Severity.error,
						short: 'Graph name is required'
					})
				} else if (this.trimmed_name.length > settings.MAX_GRAPH_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Graph name is too long'
					})
				} else if ($course.graphs.some(graph => graph.name === this.trimmed_name)) {
					validation.add({
						severity: Severity.error,
						short: 'Graph name isn\'t unique'
					})
				}
			}

			return validation
		}

		async submit() {
			this.touchAll()
			if (this.validate().severity === Severity.error) {
				graph_modal = graph_modal // Trigger reactivity
				return
			}

			// Create graph
			await GraphController.create($course.cache, $course, this.trimmed_name)
			$course = $course // Trigger reactivity
			graph_modal.hide()
		}
	}

    // Variables
    let graph_modal = new GraphModal()
    let graph_query = ''
    $: filtered_graphs = $course.graphs.filter(graph => graph.matchesQuery(graph_query))

</script>

<Modal bind:this={graph_modal.modal}>
	<h3 slot="header"> Create Graph </h3>
	Add a new graph to this course. Graphs are visual representations of the course content. They are intended to help students understand the course structure.

	<form>
		<label for="name"> Graph Name </label>
		<Textfield id="name" bind:value={graph_modal.name} />

		<footer>
			<Button
				disabled={graph_modal.validate().severity === Severity.error}
				on:click={() => graph_modal.submit()}
			> Create </Button>
			<Feedback data={graph_modal.validate()} />
		</footer>
	</form>
</Modal>

<Card>
    <svelte:fragment slot="header">
        <h3 slot="header"> Graphs </h3>
        <div class="flex-spacer" />
        <Searchbar placeholder="Search graphs" bind:value={graph_query} />
        <Button on:click={() => graph_modal.show()}>
            <img src={plus_icon} alt="" /> New Graph
        </Button>
    </svelte:fragment>

    {#if filtered_graphs.length === 0}
        <p class="grayed"> There's nothing here </p>
    {:else}
        {#each filtered_graphs as graph}
            <GraphRow {graph} />
        {/each}
    {/if}
</Card>