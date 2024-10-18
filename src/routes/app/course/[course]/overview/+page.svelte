
<script lang="ts">

	// External imports
	import { writable } from 'svelte/store'

	// Internal imports
	import { GraphController, LinkController } from '$scripts/controllers'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	// Components
	import Layout from '$components/layouts/DefaultLayout.svelte'
	import Card from '$components/layouts/Card.svelte'
	import Modal from '$components/layouts/Modal.svelte'
	import Button from '$components/buttons/Button.svelte'
	import LinkButton from '$components/buttons/LinkButton.svelte'
	import Textfield from '$components/forms/Textfield.svelte'
	import Validation from '$components/Validation.svelte'
	import Dropdown from '$components/forms/Dropdown.svelte'
	import LinkRow from './LinkRow.svelte'
	import GraphRow from './GraphRow.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'


	// Helpers
	class GraphModal extends BaseModal {
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.name.trim() === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() {
			await GraphController.create(cache, $course.id, this.name)
			graph_modal.hide()
			$course = $course
		}
	}

	class LinkModal extends BaseModal {
		name: string = ''
		graph?: number

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.name.trim() === '') {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}

		async submit() {
			await LinkController.create(cache, $course.id, this.name, this.graph || null)
			link_modal.hide()
			$course = $course
		}
	}

	// Variables
	export let data
	const cache = data.cache
	const course = writable(data.course)

	const graph_modal = new GraphModal()
	const link_modal = new LinkModal()

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
			href: `/app/course/${$course.code}/overview`
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

				{#await $course.getGraphOptions() then options}
					<label for="graph"> Graph </label>
					<Dropdown
						label="Graph"
						placeholder="Select a graph"
						options={options}
						bind:value={link_modal.graph}
					/>
				{/await}

				<footer>
					<Button
						disabled={!link_modal.validate().okay()}
						on:click={() => link_modal.submit()}
					> Create </Button>
					<Validation data={link_modal.validate()} />
				</footer>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header">Graphs</h3>

		<svelte:fragment slot="body">
			{#if $course.graph_ids.length === 0}
				<p class="grayed"> There's nothing here </p>
			{:else}
				{#await $course.getGraphs() then graphs}
					{#each graphs as graph}
						<GraphRow
							graph={graph}
							course={$course}
							update={() => $course = $course}
							/>
					{/each}
				{/await}
			{/if}
		</svelte:fragment>
	</Card>

	<Card>
		<h3 slot="header">Links</h3>

		<svelte:fragment slot="body">
			{#if $course.link_ids.length === 0}
				<p class="grayed"> There's nothing here </p>
			{:else}
				{#await $course.getLinks() then links}
					{#each links as link}
						<LinkRow 
							link={link} 
							course={$course} 
							update={() => $course = $course} 
							/>
					{/each}
				{/await}
			{/if}
		</svelte:fragment>
	</Card>
</Layout>


<!-- Styles -->


<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.grayed
		margin: auto
		color: $placeholder-color

</style>
