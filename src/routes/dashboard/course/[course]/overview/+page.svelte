
<!-- Script -->

<script lang="ts">

	import Layout from '$layouts/EditorLayout.svelte';
	import Card from '$components/Card.svelte';
	import Modal from '$components/Modal.svelte';
	import Tooltip from '$components/Tooltip.svelte';
	import Row from '$components/Row.svelte';
	import TextInput from '$components/RowTextInput.svelte';

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
		["Dashboard", "/dashboard"],
		[`${course.code} ${course.name}`, `/dashboard/course/${course.code}/overview`]
	]}
>
	<svelte:fragment slot="toolbar">
		<Modal>
			<span slot="trigger" class="btn"><img src="{plusIcon}" alt="Plus icon"> New Graph </span>
			<h3 slot="header"> Create Graph </h3>

			<form>
				<TextInput label="Name"/>
				<Row><button slot="right" class="btn" on:click={newGraph}> Create </button></Row>
			</form>
		</Modal>

		<button class="btn" on:click={newLink}> 
			<img src="{plusIcon}" alt="Plus icon"> New Link
		</button>

		<div class="flex-spacer" />

		<a class="link-btn" href="/dashboard/course/${course.code}/settings">
			<img class="rotate-on-hover" src={gearIcon} alt="Cog icon"> Settings
		</a>
	</svelte:fragment>

	<Card>
		<svelte:fragment slot="header">
			<h3> Graphs </h3>
		</svelte:fragment>

		<svelte:fragment slot="body">
			{#each graphs as graph}
				<span class="graph"> 
					{#if graph.has_links} <img src={linkIcon} alt="Link icon" /> {/if}
					{graph.name}

					<div class="flex-spacer" />
					
					<Tooltip data="Program Coordinators">
						<img class="img-btn scale-on-hover" class:disabled={!graph.has_visibility} src={graph.has_visibility ? openEyeIcon : closedEyeIcon} alt="Eye icon" />
					</Tooltip>

					<Tooltip data="Program Coordinators">
						<img class="img-btn scale-on-hover" src={pencilIcon} alt="Pencil icon" />
					</Tooltip>

					<Tooltip data="Program Coordinators">
						<img class="img-btn scale-on-hover" src={copyIcon} alt="Copy icon" />
					</Tooltip>

					<Tooltip data="Program Coordinators">
						<img class="img-btn scale-on-hover" src={trashIcon} alt="Trash icon" />
					</Tooltip>
				</span>
			{/each}
		</svelte:fragment>
	</Card>

	<Card>
		<svelte:fragment slot="header">
			<h3> Links </h3>
		</svelte:fragment>
	</Card>
</Layout>

<!-- Styles -->

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	h1
		font-size: 1.5rem
	
	.graph
		display: flex
		flex-flow: row nowrap
		align-items: center
		
		position: relative
		padding: 0.5rem
		padding-left: 2rem
		
		color: $dark-gray

		&:not(:last-child)
			border-bottom: 1px solid $gray

		img:first-child
			position: absolute
			transform: translate(0, -50%)
			left: 0.5rem
			top: 50%

			width: 1rem

			filter: $black-filter

</style>