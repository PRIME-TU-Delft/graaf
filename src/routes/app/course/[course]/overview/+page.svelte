
<script lang="ts">

	// External imports
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	// Internal imports
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'
	
	import {
		CourseController,
		GraphController,
		LinkController 
	} from '$scripts/controllers'
	
	import type { DropdownOption } from '$scripts/types'

	// Components
	import Layout from '$components/layouts/DefaultLayout.svelte'
	import Card from '$components/layouts/Card.svelte'
	import Modal from '$components/layouts/Modal.svelte'
	import Validation from '$components/Validation.svelte'
	import Textfield from '$components/forms/Textfield.svelte'
	import Dropdown from '$components/forms/Dropdown.svelte'
	import Button from '$components/buttons/Button.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'

	import LinkRow from './LinkRow.svelte'
	import GraphRow from './GraphRow.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'

	// Helpers
	class GraphModal extends BaseModal {
		name: string = ''

		get trimmed_name() {
			return this.name.trim()
		}

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.trimmed_name === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() {
			await GraphController.create(cache, $course.id, this.trimmed_name)
			graph_modal.hide()
			update()
		}
	}

	class LinkModal extends BaseModal {
		name: string = ''
		graph?: GraphController

		get trimmed_name() {
			return this.name.trim()
		}

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.trimmed_name === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() {
			await LinkController.create(cache, $course.id, this.graph?.id || null, this.trimmed_name)
			link_modal.hide()
			update()
		}
	}

	// Exports
	export let data

	// Stores
	const cache = data.cache
	
	const course = writable(data.course)
	const course_options = writable<DropdownOption<CourseController>[] | undefined>(undefined)
	const graphs = writable(data.graphs)
	const graph_options = writable<DropdownOption<GraphController>[] | undefined>(undefined)
	const links = writable(data.links)

	onMount(() => {
		course.subscribe(async () => $graphs = await $course.getGraphs())
		course.subscribe(async () => $links = await $course.getLinks())
		course.subscribe(async () => $course_options = await $course.getCourseOptions())
		course.subscribe(async () => $graph_options = await $course.getGraphOptions())
	})

	// Modals
	const graph_modal = new GraphModal()
	const link_modal = new LinkModal()

	// Update
	const update = () => $course = $course

</script>


<!-- Markup -->


<Layout
	path={[
		{
			name: 'Dashboard',
			href: '/app/dashboard'
		},
		{
			name: `${$course.code} ${$course.name}`,
			href: `/app/course/${$course.id}/overview`
		},
		{
			name: 'Overview',
			href: `/app/course/${$course.id}/overview`
		}
	]}
>
	<svelte:fragment slot="header">
		Here you can view the graphs and links associated to this course, and edit their properties.
	</svelte:fragment>

	<svelte:fragment slot="toolbar">
		<Button on:click={() => graph_modal.show()}>
			<img src={plusIcon} alt="" /> New Graph
		</Button>

		<Button on:click={() => link_modal.show()}>
			<img src={plusIcon} alt="" /> New Link
		</Button>

		<div class="flex-spacer" />

		<LinkButton href="/app/course/{$course.id}/settings"> Course settings </LinkButton>
	</svelte:fragment>

	<Card>
		<h3 slot="header"> Graphs </h3>

		<svelte:fragment slot="body">
			{#if $graphs === undefined || $course_options === undefined}
				<p class="grayed"> Loading... </p>
			{:else if $graphs.length === 0}
				<p class="grayed"> There's nothing here </p>
			{:else}
				{#each $graphs as graph}
					<GraphRow {graph} {update}
						course={$course}
						course_options={$course_options}
					/>
				{/each}
			{/if}
		</svelte:fragment>
	</Card>

	<Card>
		<h3 slot="header">Links</h3>

		<svelte:fragment slot="body">
			{#if $links === undefined || $graph_options === undefined}
				<p class="grayed"> Loading... </p>
			{:else if $links.length === 0}
				<p class="grayed"> There's nothing here </p>
			{:else}
				{#each $links as link}
					<LinkRow {link} {update} 
						graph_options={$graph_options}
					/>
				{/each}
			{/if}
		</svelte:fragment>
	</Card>
</Layout>

<Modal bind:this={graph_modal.modal}>
	<h3 slot="header"> Create Graph </h3>
	Add a new graph to this course. Graphs are visual representations of the course content. They are intended to help students understand the course structure.

	<form>
		<label for="name"> Graph Name </label>
		<Textfield id="name" bind:value={graph_modal.name} />

		<footer>
			<Button
				disabled={!graph_modal.validate().okay()}
				on:click={() => graph_modal.submit()}
			> Create </Button>
			<Validation data={graph_modal.validate()} />
		</footer>
	</form>
</Modal>

<Modal bind:this={link_modal.modal}>
	<h3 slot="header"> Create Link </h3>
	Add a new link to this course. This will link to a graph in this course, and can be provided to students, or embedded into course material.

	<form>
		<label for="name"> Link Name </label>
		<Textfield id="name" bind:value={link_modal.name} />

		{#if $graph_options !== undefined}
			<label for="graph"> Graph </label>
			<Dropdown
				id="graph"
				placeholder="Select a graph"
				options={$graph_options}
				bind:value={link_modal.graph}
			/>
		{/if}

		<footer>
			<Button
				disabled={!link_modal.validate().okay()}
				on:click={() => link_modal.submit()}
			> Create </Button>
			<Validation data={link_modal.validate()} />
		</footer>
	</form>
</Modal>
