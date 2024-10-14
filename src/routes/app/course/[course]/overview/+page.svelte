
<script lang="ts">

	// External imports
	import { writable } from 'svelte/store'

	// Internal imports
	import { GraphController, LinkController } from '$scripts/controllers'
	import { ValidationData, Severity } from '$scripts/validation'
	import { BaseModal } from '$scripts/modals'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte'
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import linkIcon from '$assets/link-icon.svg'
	import openEyeIcon from '$assets/open-eye-icon.svg'
	import closedEyeIcon from '$assets/closed-eye-icon.svg'
	import pencilIcon from '$assets/pencil-icon.svg'
	import copyIcon from '$assets/copy-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'
	import Dropdown from '$components/Dropdown.svelte';
	import { validate } from 'uuid';

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
			await GraphController.create(environment, $course.id, this.name)
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
			await LinkController.create(environment, $course.id, this.name, this.graph || null)
			link_modal.hide()
			$course = $course
		}
	}

	// Variables
	export let data
	const environment = data.environment
	const course = writable(data.course)

	const graph_modal = new GraphModal()
	const link_modal = new LinkModal()

</script>


<!-- Markup -->


<Layout
	description="Here you can view the graphs and links associated to this course, and edit their properties."
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
				<Textfield label="Name" bind:value={graph_modal.name} />

				<footer>
					<Button
						disabled={graph_modal.validate().severity === Severity.error}
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
				<Textfield label="Name" bind:value={link_modal.name} />

				<label for="graph"> Graph </label>
				{#await $course.getGraphOptions() then options}
					<Dropdown
						label="Graph"
						placeholder="Select a graph"
						options={options}
						bind:value={link_modal.graph}
					/>

				{/await}

				<footer>
					<Button
						disabled={link_modal.validate().severity === Severity.error}
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
						<span class="graph">
							{#if graph.link_ids.length > 0}
								<img src={linkIcon} alt="Link icon" />
							{/if}

							{graph.name}

							<div class="flex-spacer" />

							<!-- TODO graph.isVisible() -->
							<IconButton scale
								src={true ? openEyeIcon : closedEyeIcon}
								description="View Graph"
								disabled={false}
							/>

							<IconButton scale
								src={pencilIcon}
								description="Edit Graph"
								href="/app/course/{$course.id}/graph/{graph.id}/settings"
							/>

							<IconButton scale src={copyIcon} description="Copy Graph" />
							<IconButton scale src={trashIcon} description="Delete Graph" />
						</span>
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
						<span class="link">
							<IconButton src={trashIcon} description="Delete Link" scale />

							{link.name}

							{#await $course.getGraphOptions() then options}
								<Dropdown
									label="Graph"
									placeholder="Select a graph"
									options={options}
									bind:value={link.graph_id}
									on:change={async () => {
										await link.save()
										$course = $course
									}}
									/>
							{/await}
						</span>
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

	.graph
		display: flex
		flex-flow: row nowrap
		align-items: center

		position: relative
		padding: 1rem
		padding-left: $total-icon-size

		color: $dark-gray

		&:not(:last-child)
			border-bottom: 1px solid $gray

		img:first-child
			position: absolute
			translate: 0 -50%
			left: $input-icon-padding
			top: 50%

			width: 1rem

			filter: $dark-purple-filter
	
	.link
		display: grid
		grid-template: "delete name graph url embed" auto / $total-icon-size 1fr 1fr max-content max-content
		align-items: center

</style>
