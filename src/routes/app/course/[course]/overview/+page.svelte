
<script lang="ts">

	import { enhance } from '$app/forms'

	// Internal imports
	import { ValidationData, Severity, BaseModal } from '$scripts/entities'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte'
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'
	import Validation from '$components/Validation.svelte'
	import Dropdown from '$components/Dropdown.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import linkIcon from '$assets/link-icon.svg'
	import openEyeIcon from '$assets/open-eye-icon.svg'
	import closedEyeIcon from '$assets/closed-eye-icon.svg'
	import pencilIcon from '$assets/pencil-icon.svg'
	import copyIcon from '$assets/copy-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'
	import gearIcon from '$assets/gear-icon.svg'

	import { Graph } from '$scripts/entities/Graph'
	import { Course } from '$scripts/entities/Course'


	// Helpers
	class GraphModal extends BaseModal {
		name: string = ''

		constructor() {
			super()
			this.initialize()
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.name.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			return result
		}
	}

	class LinkModal extends BaseModal {
		name: string = ''
		graph?: number

		constructor() {
			super()
			this.initialize()
		}

		get graph_options() {
			return graphs.map(graph => {
				return { 
					name: graph.name,
					value: graph.id, 
					validation: ValidationData.success()
				}
			})
		}

		validate(): ValidationData {
			const result = new ValidationData()

			if (this.name.length < 1) {
				result.add({
					severity: Severity.error,
					short: 'Name is required'
				})
			}

			if (this.graph === undefined) {
				result.add({
					severity: Severity.error,
					short: 'Graph is required'
				})
			}

			return result
		}
	}

	// Variables
	export let data
	$: course = Course.revive(data.course);
	$: graphs = data.graphs.map(graph => Graph.revive(graph));

	const graph = new GraphModal()
	const link = new LinkModal()

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
			name: `${course.code} ${course.name}`,
			href: `/app/course/${course.code}/overview`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Button on:click={graph.show}>
			<img src={plusIcon} alt="" /> New Graph
		</Button>

		<Button on:click={link.show}>
			<img src={plusIcon} alt="" /> New Link
		</Button>

		<div class="flex-spacer" />

		<LinkButton href="/app/course/{course.code}/settings">
			<img src={gearIcon} alt=""> Settings
		</LinkButton>

		<Modal bind:this={graph.modal}>
			<h3 slot="header"> Create Graph </h3>
			Add a new graph to this course. Graphs are visual representations of the course content. They are intended to help students understand the course structure.

			<form method="POST" action="?/newGraph" use:enhance={() => graph.hide()}>
				<label for="name"> Graph Name </label>
				<Textfield label="Name" bind:value={graph.name} />

				<footer>
					<Button submit disabled={graph.validate().severity === Severity.error}> Create </Button>
					<Validation data={graph.validate()} />
				</footer>
			</form>
		</Modal>

		<Modal bind:this={link.modal}>
			<h3 slot="header"> Create Link </h3>
			Add a new link to this course. This will link to a graph in this course, and can be provided to students, or embedded into course material.

			<form method="POST" action="?/newLink" use:enhance={() => link.hide()}>
				<label for="name"> Graph Name </label>
				<Textfield label="Name" bind:value={link.name} />

				<label for="graph"> Graph </label>
				<Dropdown label="Graph" placeholder="Select a graph" options={link.graph_options} bind:value={link.graph} />

				<footer>
					<Button submit disabled={graph.validate().severity === Severity.error}> Create </Button>
					<Validation data={link.validate()} />
				</footer>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header">Graphs</h3>

		<svelte:fragment slot="body">
			{#if graphs.length === 0}
				<p class="grayed"> There's nothing here. </p>
			{/if}	
		
			{#each graphs as graph}
				<span class="graph">
					{#if graph.hasLinks()}
						<img src={linkIcon} alt="Link icon" />
					{/if}
					{graph.name}

					<div class="flex-spacer" />

					<IconButton
						src={graph.isVisible() ? openEyeIcon : closedEyeIcon}
						description="View Graph"
						disabled={!graph.isVisible()}
						scale
					/>

					<IconButton
						src={pencilIcon}
						description="Edit Graph"
						href="/app/course/{course.code}/graph/{graph.id}/settings"
						scale
					/>

					<IconButton src={copyIcon} description="Copy Graph" scale />

					<IconButton src={trashIcon} description="Delete Graph" scale />
				</span>
			{/each}
		</svelte:fragment>
	</Card>

	<Card>
		<h3 slot="header">Links</h3>
		
		<svelte:fragment slot="body">
			{#if true}
				<p class="grayed"> There's nothing here. </p>
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
		padding-left: calc($input-icon-size + 2 * $input-icon-padding)

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

</style>
