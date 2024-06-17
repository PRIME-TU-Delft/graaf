
<script lang="ts">

	import { enhance } from '$app/forms'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte'
	import Card from '$components/Card.svelte'
	import Modal from '$components/Modal.svelte'
	import Button from '$components/Button.svelte'
	import LinkButton from '$components/LinkButton.svelte'
	import IconButton from '$components/IconButton.svelte'
	import Textfield from '$components/Textfield.svelte'

	// Assets
	import plusIcon from '$assets/plus-icon.svg'
	import linkIcon from '$assets/link-icon.svg'
	import openEyeIcon from '$assets/open-eye-icon.svg'
	import closedEyeIcon from '$assets/closed-eye-icon.svg'
	import pencilIcon from '$assets/pencil-icon.svg'
	import copyIcon from '$assets/copy-icon.svg'
	import trashIcon from '$assets/trash-icon.svg'

	function newLink() {
		// TODO add newLink function
	}

	let createGraphModal: Modal

	// TODO EVERYTHING BELOW THIS LINE IS TEMPORARY

	export let data;
	$: course = data.course;

</script>



<!-- Markup -->



<Layout
	description="Here you can view the graphs and links associated to this course, and edit their properties."
	path={[
		{
			name: 'Dashboard',
			href: '/dashboard'
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/course/${course.code}/overview`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Button on:click={createGraphModal?.show}>
			<img src={plusIcon} alt="" /> New Graph
		</Button>

		<Button on:click={newLink}>
			<img src={plusIcon} alt="" /> New Link
		</Button>

		<div class="flex-spacer" />

		<LinkButton href="/course/{course.code}/settings">Settings</LinkButton>

		<Modal bind:this={createGraphModal}>
			<h3 slot="header">Create Graph</h3>

			<form method="POST" action="?/newGraph" use:enhance={createGraphModal.hide}>
				<label for="name"> Name </label>
				<Textfield label="Name" />

				<Button submit>Create</Button>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header">Graphs</h3>

		<svelte:fragment slot="body">
			{#each course.graphs as graph}
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
						href="/course/{course.code}/graph/{graph.id}/settings"
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
	</Card>
</Layout>



<!-- Styles -->



<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	form
		display: grid
		grid-template: "label content" auto / 1fr 2fr
		place-items: center start

		label
			grid-column: label
			justify-self: end

			margin-top: $form-small-gap
			padding-right: $form-medium-gap

		:global(.textfield)
			grid-column: content
			margin-top: $form-small-gap

		:global(.button)
			grid-column: content
			margin-top: $form-big-gap

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
