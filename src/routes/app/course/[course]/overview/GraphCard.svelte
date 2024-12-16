<script lang="ts">
	// Internal dependencies
	import * as settings from '$scripts/settings';
	import { course } from './stores';

	import { Validation, Severity } from '$scripts/validation';
	import { GraphController } from '$scripts/controllers';
	import { AbstractFormModal } from '$scripts/modals';

	// Components
	import GraphRow from './GraphRow.svelte';

	import FormModal from '$components/FormModal.svelte';
	import Searchbar from '$components/Searchbar.svelte';
	import Textfield from '$components/Textfield.svelte';
	import Button from '$components/Button.svelte';
	import Card from '$components/Card.svelte';

	// Assets
	import plus_icon from '$assets/plus-icon.svg';

	// Modals
	class GraphModal extends AbstractFormModal {
		name: string = '';

		constructor() {
			super();
			this.initialize();
		}

		validate(): Validation {
			const validation = new Validation();

			if (this.hasChanged('name')) {
				if (this.name.trim() === '') {
					validation.add({
						severity: Severity.error,
						short: 'Graph name is required'
					});
				} else if (this.name.trim().length > settings.MAX_GRAPH_NAME_LENGTH) {
					validation.add({
						severity: Severity.error,
						short: 'Graph name is too long'
					});
				} else if ($course.graphs.some((graph) => graph.trimmed_name === this.name.trim())) {
					validation.add({
						severity: Severity.error,
						short: "Graph name isn't unique"
					});
				}
			}

			return validation;
		}

		async submit() {
			await GraphController.create($course.cache, $course, this.name.trim());
			$course = $course; // Trigger reactivity
		}
	}

	// Main
	const graph_modal = new GraphModal();
	let query = $state('');

	const filtered_graphs = $derived($course.graphs.filter((graph) => graph.matchesQuery(query)));
</script>

<!-- Markup -->

<FormModal controller={graph_modal}>
	{#snippet header()}
		Create Graph
	{/snippet}
	Add a new graph to this course. Graphs are visual representations of the course content. They are intended
	to help students understand the course structure.

	{#snippet form()}
		<label for="name"> Graph Name </label>
		<Textfield id="name" bind:value={graph_modal.name} />
	{/snippet}

	{#snippet submit()}
		Create
	{/snippet}
</FormModal>

<Card>
	{#snippet header()}
		Graphs

		<div class="flex-spacer"></div>

		<Searchbar placeholder="Search graphs" bind:value={query} />
		<Button onclick={() => graph_modal.show()}>
			<img src={plus_icon} alt="" /> New Graph
		</Button>
	{/snippet}

	{#if filtered_graphs.length === 0}
		<p class="grayed">There's nothing here</p>
	{:else}
		{#each filtered_graphs as graph}
			<GraphRow {graph} />
		{/each}
	{/if}
</Card>
