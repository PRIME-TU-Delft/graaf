<!-- Script -->

<script lang="ts">
	import Layout from '$layouts/DefaultLayout.svelte';
	import Tabular from '$components/Tabular.svelte';
	import GraphEditor from './GraphEditor.svelte';
	import Button from '$components/Button.svelte';

	import { page } from '$app/stores';

	function saveLayout() {
		// TODO add SaveLayout function
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

	function getGraph(id: number): Graph {
		for (let graph of graphs) {
			if (graph.id === id) {
				return graph;
			}
		}

		throw new Error(`Graph with id ${id} not found`);
	}

	let courses = [
		new Course('AESB1311', 'Linear Algebra'),
		new Course('CSE1200', 'Calculus'),
		new Course('CSE1205', 'Linear Algebra'),
		new Course('CSE1210', 'Cluster Probability & Statistics'),
		new Course('CTB2105', 'Differentiaalvergelijkingen'),
		new Course('CTB2200', 'Kansrekening en Statistiek'),
		new Course('EE1M11', 'Linear Algebra and Analysis A'),
		new Course('EE1M21', 'Linear Algebra and Analysis B'),
		new Course('LB1155', 'Calculus'),
		new Course('NB2191', 'Differential Equations'),
		new Course('TB131B', 'Differentiaalvergelijkingen en Lineare Algebra'),
		new Course('TB132B', 'Multivariabele Calculus en Lineaire Algebra'),
		new Course('TN1401WI', 'Analyse voor TNW 1'),
		new Course('WBMT', 'Linear Algebra'),
		new Course('WBMT1050', 'Calculus for Engineering'),
		new Course('WI1402LR', 'Calculus II'),
		new Course('WI1403LR', 'Linear Algebra'),
		new Course('WI1421LR', 'Calculus I'),
		new Course('WI2031TH', 'Probability and Statistics')
	];

	let graphs = [new Graph(1, 'Graph 2021', true, true), new Graph(2, 'Graph 2022', false, false)];

	let course: Course = getCourse($page.params.course); // TODO actual api call
	let graph: Graph = getGraph(Number($page.params.graph)); // TODO actual api call
</script>

<!-- Markup -->

<Layout
	description="Here you can edit the layout of your graph. Drag and drop the nodes to change their position, and click on the nodes to edit their properties."
	path={[
		{
			name: 'Dashboard',
			href: '/dashboard'
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
			name: 'Edit',
			href: `/course/${course.code}/graph/${graph.id}/edit`
		}
	]}
>
	<svelte:fragment slot="toolbar">
		<div class="flex-spacer" />

		<Button on:click={saveLayout}>Save Layout</Button>
	</svelte:fragment>

	<Tabular
		tabs={[
			{
				title: 'Overview',
				content: GraphEditor
			},
			{
				title: 'Layout',
				content: GraphEditor
			},
			{
				title: 'Properties',
				content: GraphEditor
			}
		]}
	/>
</Layout>
