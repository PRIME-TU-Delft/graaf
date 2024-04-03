
<!-- Script -->

<script lang="ts">

	import Layout from '$layouts/DefaultLayout.svelte';
	import Card from '$components/Card.svelte';
	import Modal from '$components/Modal.svelte';

	import Button from '$components/Button.svelte';
	import LinkButton from '$components/LinkButton.svelte';
	import IconButton from '$components/IconButton.svelte';
	import Textfield from '$components/Textfield.svelte';

	import plusIcon from '$assets/plus-icon.svg';
	import gearIcon from '$assets/gear-icon.svg';
	import linkIcon from '$assets/link-icon.svg';
	import openEyeIcon from '$assets/open-eye-icon.svg';
	import closedEyeIcon from '$assets/closed-eye-icon.svg';
	import pencilIcon from '$assets/pencil-icon.svg';
	import copyIcon from '$assets/copy-icon.svg';
	import trashIcon from '$assets/trash-icon.svg';

	import { page } from '$app/stores';

	function newGraph() {
		// TODO add newGraph function
	}

	function newLink() {
		// TODO add newLink function
	}

	let createGraphModal: Modal;

	// TODO EVERYTHING BELOW THIS LINE IS TEMPORARY

	class Course {
		code: string;
		name: string;

		constructor(code: string, name: string) {
			this.code = code;
			this.name = name;
		}
	}

	class Graph {
		id: number;
		name: string;
		has_links: boolean;
		has_visibility: boolean;

		constructor(id: number, name: string, has_links: boolean, has_visibility: boolean) {
			this.id = id;
			this.name = name;
			this.has_links = has_links;
			this.has_visibility = has_visibility;
		}
	}	

	function getCourse(code: string): Course {
		for (let course of courses) {
			if (course.code === code) {
				return course;
			}
		}

		throw new Error(`Course with code ${code} not found`);
	}

	let courses = [
		new Course("AESB1311", "Linear Algebra"),
		new Course("CSE1200",  "Calculus"),
		new Course("CSE1205",  "Linear Algebra"),
		new Course("CSE1210",  "Cluster Probability & Statistics"),
		new Course("CTB2105",  "Differentiaalvergelijkingen"),
		new Course("CTB2200",  "Kansrekening en Statistiek"),
		new Course("EE1M11",   "Linear Algebra and Analysis A"),
		new Course("EE1M21",   "Linear Algebra and Analysis B"),
		new Course("LB1155",   "Calculus"),
		new Course("NB2191",   "Differential Equations"),
		new Course("TB131B",   "Differentiaalvergelijkingen en Lineare Algebra"),
		new Course("TB132B",   "Multivariabele Calculus en Lineaire Algebra"),
		new Course("TN1401WI", "Analyse voor TNW 1"),
		new Course("WBMT",     "Linear Algebra"),
		new Course("WBMT1050", "Calculus for Engineering"),
		new Course("WI1402LR", "Calculus II"),
		new Course("WI1403LR", "Linear Algebra"),
		new Course("WI1421LR", "Calculus I"),
		new Course("WI2031TH", "Probability and Statistics")
	]

	let graphs = [
		new Graph(1, "Graph 2021", true, true),
		new Graph(2, "Graph 2022", false, false)
	]

	let course: Course = getCourse($page.params.course); // TODO actual api call

</script>

<!-- Markup -->

<Layout
	description="Here you can view the graphs and links associated to this course, and edit their properties."
	path={[
		{
			name: "Dashboard",
			href: "/dashboard"
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/course/${course.code}/overview`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<Button on:click={createGraphModal?.show}>
			<img src={plusIcon} alt=""> New Graph
		</Button>

		<Button on:click={newLink}>
			<img src={plusIcon} alt=""> New Link
		</Button>

		<div class="flex-spacer" />

		<LinkButton href="/course/{course.code}/settings">
			Settings
		</LinkButton>

		<Modal bind:this={createGraphModal}>
			<h3 slot="header"> Create Graph </h3>

			<form>
				<label for="name"> Name </label>
				<Textfield label="Name"/>

				<Button submit on:click={createGraphModal.hide}> Create </Button>
			</form>
		</Modal>
	</svelte:fragment>

	<Card>
		<h3 slot="header"> Graphs </h3>

		<svelte:fragment slot="body">
			{#each graphs as graph}
				<span class="graph"> 
					{#if graph.has_links} <img src={linkIcon} alt="Link icon" /> {/if}
					{graph.name}

					<div class="flex-spacer" />
					
					<IconButton 
						src={graph.has_visibility ? openEyeIcon : closedEyeIcon}
						description="View Graph"
						disabled={!graph.has_visibility}
						scale
						/>

					<IconButton
						src={pencilIcon} 
						description="Edit Graph" 
						href="/course/{course.code}/graph/{graph.id}/edit" 
						scale
						/>

					<IconButton 
						src={copyIcon} 
						description="Copy Graph" 
						scale
						/>
					
					<IconButton
						src={trashIcon} 
						description="Delete Graph" 
						scale
						/>
				</span>
			{/each}
		</svelte:fragment>
	</Card>

	<Card>
		<h3 slot="header"> Links </h3>
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