
<script lang="ts">

	// External imports
	import { writable } from 'svelte/store'

	// Internal imports
	import { CourseController, GraphController } from '$scripts/controllers'
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

	// Functions
	async function load() {
		course.set(
			await CourseController.revive(data.course)
				.then(course => course.expand())
		)
	}

	function update() {
		course.update(() => $course)
	}

	// Variables
	export let data
	const course = writable<CourseController>()

	const graph_modal = new GraphModal()

</script>


<!-- Markup -->


{#await load() then}

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

			<Button>
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
							on:click={async () => {
								await GraphController.create($course, graph_modal.name)
								graph_modal.hide()
								update()
							}}
						> Create </Button>
						<Validation data={graph_modal.validate()} />
					</footer>
				</form>
			</Modal>

			<!--
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
			-->
		</svelte:fragment>

		<Card>
			<h3 slot="header">Graphs</h3>

			<svelte:fragment slot="body">
				{#if $course.graphs.length === 0}
					<p class="grayed"> There's nothing here. </p>
				{/if}

				{#each $course.graphs as graph}
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
							href="/app/course/{$course.id}/graph/{graph.id}/settings"
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

{/await}



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
