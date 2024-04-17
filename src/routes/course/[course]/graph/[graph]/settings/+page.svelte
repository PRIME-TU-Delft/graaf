
<!-- Script -->

<script lang="ts">

	import Layout from '$layouts/DefaultLayout.svelte';
	import Modal from '$components/Modal.svelte';
	import Button from '$components/Button.svelte';
	import LinkButton from '$components/LinkButton.svelte';

	import GeneralSettings from './GeneralSettings.svelte';
	import NodeSettings from './NodeSettings.svelte';

	import saveIcon from "$assets/save-icon.svg";
	import trashIcon from "$assets/trash-icon.svg";

	import { page } from '$app/stores';

	function saveChanges() {
		// TODO add SaveLayout function
	}

	function deleteGraph() {
		deleteGraphModal.hide();
		// TODO add deleteGraph function
	}

	let deleteGraphModal: Modal;
	let activeTab = 0;





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

	function getGraph(id: number): Graph {
		for (let graph of graphs) {
			if (graph.id === id) {
				return graph;
			}
		}

		throw new Error(`Graph with id ${id} not found`);
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
	let graph: Graph = getGraph(Number($page.params.graph)); // TODO actual api call

</script>

<!-- Markup -->

<Layout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: "Dashboard",
			href: "/dashboard"
		},
		{
			name: `${course.code} ${course.name}`,
			href: `/course/${course.code}/overview`
		},
		{
			name: graph.name,
			href: `/course/${course.code}/graph/${graph.id}/overview`
		},
		{
			name: "Settings",
			href: `/course/${course.code}/graph/${graph.id}/settings`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<div class="flex-spacer" />

		<Button on:click={deleteGraphModal.show}> <img src={trashIcon} alt=""> Delete Graph </Button>
		<Button on:click={saveChanges}> <img src={saveIcon} alt=""> Save Changes </Button>

		<Modal bind:this={deleteGraphModal}>
			<h3 slot="header"> Delete Graph </h3>
			Are you sure you want to delete {graph.name}?

			<div class="button-row">
				<LinkButton on:click={deleteGraphModal.hide}> Cancel </LinkButton>
				<Button on:click={deleteGraph}> Delete Graph </Button>
			</div>
		</Modal>
	</svelte:fragment>

	<div class="tabular">
		<div class="tabs">
			<button
				class:active={activeTab === 0}
				on:click={() => activeTab = 0}
			> General </button>

			<button
				class:active={activeTab === 1}
				on:click={() => activeTab = 1}
			> Domains & Subjects </button>

			<button
				class:active={activeTab === 2}
				on:click={() => activeTab = 2}
			> Relations </button>
	
			<div class="dynamic-border" />
		</div>
	
		{#if activeTab === 0}
			<GeneralSettings graph={graph} course={course} courses={courses} />
		{:else if activeTab === 1}
			<NodeSettings />
		{:else if activeTab === 2}
			<NodeSettings />
		{/if}
	</div>
</Layout>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.button-row
		display: flex
		flex-flow: row nowrap
		justify-content: end
		gap: $form-small-gap

		margin-top: $form-big-gap
	
	.tabular
		border-radius: $border-radius
		border: 1px solid $gray

		.tabs
			display: flex
			flex-flow: row nowrap

			background: $light-gray
			border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

			.dynamic-border
				flex: 1
				border-bottom: 1px solid $gray

			button
				display: block
				margin: 0
				padding: $card-thin-padding $card-thick-padding

				border-color: $gray
				border-style: solid
				border-width: 0 0 1px 1px
				border-radius: calc($border-radius - 1px) calc($border-radius - 1px) 0 0

				text-align: left

				&.active
					background: $white
					border-width: 0 1px 0 1px

					& ~ button
						border-width: 0 1px 1px 0


				&:first-child
					border-left: none !important

</style>