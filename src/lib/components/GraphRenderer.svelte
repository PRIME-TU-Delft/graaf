<script lang="ts">
	import { fade } from 'svelte/transition';
	import * as settings from '$lib/settings';
	import { GraphD3, GraphView } from '$lib/d3/GraphD3';

	import ZoomIn from 'lucide-svelte/icons/zoom-in';
	import ZoomOut from 'lucide-svelte/icons/zoom-out';

	import type { PrismaGraphPayload } from '$lib/d3/types';

	let { data, editable }: { data: PrismaGraphPayload; editable: boolean } = $props();

	const graphD3 = new GraphD3(data, editable);
	let expand_legend = $state(false);
	let show_legend = $derived.by(
		() => graphD3.view !== GraphView.domains && graphD3.graph_data.domain_nodes.length > 0
	);
	
	let show_zoom = $derived.by(() => graphD3.view !== GraphView.lectures);
</script>

<!-- Markup -->

<div class="graph">
	<svg use:graphD3.attach />

	{#if show_legend}
		<button
			class="legend"
			class:expand={expand_legend}
			onclick={() => (expand_legend = !expand_legend)}
			transition:fade={{ duration: settings.GRAPH_ANIMATION_DURATION }}
		>
			<h4 class="title">Domain Legend</h4>
			<div class="caret"></div>

			{#if expand_legend}
				{#each graphD3.graph_data.domain_nodes as domain}
					<span> {domain.text} </span>
					<div class="preview" style:background={settings.COLORS[domain.style]}></div>
				{/each}
			{/if}
		</button>
	{/if}

	{#if show_zoom}
		<div class="zoom" transition:fade={{ duration: settings.GRAPH_ANIMATION_DURATION }}>
			<button onclick={() => graphD3.zoomIn()}> <ZoomIn /> </button>
			<button onclick={() => graphD3.zoomOut()}> <ZoomOut /> </button>
		</div>
	{/if}
</div>

<!-- Styles -->

<!-- Styling with plain css, discuss how to do this in the future -->
<style>
	.graph {
		position: relative;
		width: 100%;
		height: 100%;
	}

	.graph svg {
		display: block;
		height: 100%;
		width: 100%;
	}

	.legend {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;

		display: grid;
		grid-template-rows: 1fr auto;
		gap: 0.25rem;

		padding: 0.75rem;

		background: #ffffff;
		border: 1px solid #d2d5dd;
		border-radius: 5px;

		cursor: pointer;
	}

	.legend:focus-visible {
		outline: 2px solid #00a6d6;
		border-color: #ffffff;
	}

	.legend span {
		color: #5a5a5e;
	}

	.legend > * {
		pointer-events: none;
	}

	.caret {
		position: absolute;
		translate: -50% -50%;
		rotate: 45deg;
		top: 1.6875rem;
		right: 0.75rem;

		width: 0.5303rem;
		height: 0.5303rem;

		border: 1px solid #5a5a5e;
		border-width: 1px 0 0 1px;
	}

	.legend.expand .caret {
		top: 1.3125rem;
		border-width: 0 1px 1px 0;
	}

	.preview {
		width: 1rem;
		height: 1rem;
	}

	.zoom {
		position: absolute;
		bottom: 0;
		right: 0;

		display: flex;
		flex-flow: column nowrap;
		padding: 0.75rem;
	}

	.zoom button {
		box-sizing: content-box;

		width: 1.75rem;
		height: 1.75rem;
		padding: 0.25rem;
		border-radius: 5px;

		cursor: pointer;
	}

	.zoom button:focus-visible {
		outline: 2px solid #00a6d6;
	}

	.zoom button img {
		width: 100%;
		height: 100%;

		transform-origin: center;
		pointer-events: none;
	}

	.zoom button:hover img {
		transform: scale(1.1);
	}
</style>
