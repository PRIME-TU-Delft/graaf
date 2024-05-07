
<!-- Script -->

<script lang="ts">

	// Svelte imports
	import type { PageData } from "./$types"
	import { onMount } from 'svelte';

	// Lib imports
	import { layout, fillLayout, updateLayout, clearLayout } from '$scripts/layout/layout'
	import * as settings from '$scripts/layout/settings'

	// Components
	import Layout from '$layouts/DefaultLayout.svelte';
	import Button from '$components/Button.svelte';

	// Assets
	import saveIcon from '$assets/save-icon.svg';

	// Exports
	export let data: PageData

	let { course, graph } = data
	let activeTab: number = 0
	let svg: SVGSVGElement

	onMount(() => {
		fillLayout(svg, graph.domains, graph.domainRelations)
	})

	function domainToSubjectTransition() {

		// Save the current layout
		const buffers = graph.subjects.map(subject => ({ subject, x: subject.x, y: subject.y }));

		// Move the subjects to their domain
		graph.subjects.forEach(subject => { 
			subject.x = subject.domain!.x; 
			subject.y = subject.domain!.y; 
		});

		// Create the new layout
		clearLayout(svg);
		fillLayout(svg, graph.subjects, graph.subjectRelations);

		// Move the subjects back to their original position
		buffers.forEach(buffer => { 
			buffer.subject.x = buffer.x; 
			buffer.subject.y = buffer.y; 
		});

		// Animate
		updateLayout(svg, true);
	}

	function subjectToDomainTransition() {

		// Save the current layout
		const buffers = graph.subjects.map(subject => ({ subject, x: subject.x, y: subject.y }));

		// Move the subjects to their domain
		graph.subjects.forEach(subject => { 
			subject.x = subject.domain!.x; 
			subject.y = subject.domain!.y; 
		});

		// Animate
		updateLayout(svg, true);

		// Restore the layout
		buffers.forEach(buffer => { 
			buffer.subject.x = buffer.x; 
			buffer.subject.y = buffer.y; 
		});

		// Show the domains after the animation
		setTimeout(() => { 
			clearLayout(svg); 
			fillLayout(svg, graph.domains, graph.domainRelations); 
		}, settings.TRANSITION_DURATION);
	}

	function swapTab(tab: number) {
		if (tab !== activeTab) {
		    if (tab === 0 && activeTab === 1) {
				subjectToDomainTransition();
		    } else if (tab === 1 && activeTab === 0) {
				domainToSubjectTransition();	
		    } else {
		        clearLayout(svg);
		    }
		}

		activeTab = tab;
	}

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
			name: "Edit",
			href: `/course/${course.code}/graph/${graph.id}/edit`
		}
	]}
>

	<svelte:fragment slot="toolbar">
		<div class="flex-spacer" />
		<Button on:click={() => graph.save()}> <img src={saveIcon} alt=""> Save Changes </Button>
	</svelte:fragment>

	<div class="tabular">
		<div class="tabs">
			<button
				class:active={activeTab === 0}
				on:click={() => swapTab(0)}
			> Domains </button>

			<button
				class:active={activeTab === 1}
				on:click={() => swapTab(1)}
			> Subjects </button>

			<button
				class:active={activeTab === 2}
				on:click={() => swapTab(2)}
			> Lectures </button>

			<div class="dynamic-border" />
		</div>

		<div class="editor">
			<svg bind:this={svg} use:layout/>
		</div>
	</div>
</Layout>

<style lang="sass">

	@use "$styles/variables.sass" as *
	@use "$styles/palette.sass" as *

	.editor
		height: 650px

		svg
			width: 100%
			height: 100%

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