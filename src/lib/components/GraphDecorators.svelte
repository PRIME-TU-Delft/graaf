<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';

	import { GraphD3 } from '$lib/d3/GraphD3';
	import { graphView } from '$lib/d3/GraphD3View.svelte';
	import * as settings from '$lib/settings';

	import {
		Check,
		ChevronDown,
		ChevronUp,
		Maximize,
		Minimize,
		Orbit,
		SearchSlash
	} from '@lucide/svelte';
	import ZoomIn from 'lucide-svelte/icons/zoom-in';
	import ZoomOut from 'lucide-svelte/icons/zoom-out';

	import { graphState } from '$lib/d3/GraphD3State.svelte';
	import { cn } from '$lib/utils';
	import screenfull from 'screenfull';
	import { fade } from 'svelte/transition';
	import { Button, buttonVariants } from './ui/button';

	type Props = {
		graphD3: GraphD3;
		editable: boolean;
		onResetSimulation: () => void;
	};

	let { graphD3, editable, onResetSimulation }: Props = $props();

	let isFullscreen = $state(false);
	let isLecturePopoverOpen = $state(false);
	let chosenLecture = $state(graphD3.lecture);

	$effect(() => {
		if (screenfull.isEnabled) {
			screenfull.on('change', () => {
				graphD3.centerOnGraph();
				isFullscreen = screenfull.isFullscreen;
			});
		}
	});

	function toggleFullscreen() {
		if (!screenfull.isEnabled || !document) return;

		const svgParent = graphD3.svg.node()?.parentElement?.parentElement;

		if (!svgParent) {
			console.error('SVG parent element not found');
			return;
		}

		screenfull.toggle(svgParent);
	}
</script>

{#if !graphView.isDomains() && graphD3.data.domain_nodes.length > 0}
	<Accordion.Root type="single" class="absolute top-4 right-4 p-3 text-purple-900">
		<Accordion.Item class="border-none" value="item-1">
			<Accordion.Trigger class="p-0">Domain Legend</Accordion.Trigger>
			<Accordion.Content>
				{#each graphD3.data.domain_nodes as domain (domain.id)}
					<div class="flex w-full items-center justify-between gap-3">
						<span class="w-full text-right text-gray-900"> {domain.text} </span>
						<div
							class="size-4"
							style:background={domain.style == null ? '#ffffff' : settings.COLORS[domain.style]}
						></div>
					</div>
				{/each}
			</Accordion.Content>
		</Accordion.Item>
	</Accordion.Root>
{/if}

<!-- Select Lecture -->
<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: 'link' }), 'absolute top-4 left-4 p-3')}
	>
		{chosenLecture?.name || 'Select a lecture'}
		<ChevronDown />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item
				onclick={() => {
					chosenLecture = null;
					graphD3.setLecture(null);
				}}
			>
				Unselect
				<Check class={cn('ml-auto w-auto', chosenLecture && 'w-0 text-transparent')} />
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			{#each graphD3.data.lectures as lecture (lecture.id)}
				<DropdownMenu.Item
					onclick={() => {
						chosenLecture = lecture;
						graphD3.setLecture(lecture);
						isLecturePopoverOpen = false;
					}}
				>
					{lecture.name}
					<Check
						class={cn('ml-auto w-auto', lecture.id !== chosenLecture?.id && 'w-0 text-transparent')}
					/>
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<!-- Zoom button -->
<div
	class="absolute right-1 bottom-1 flex flex-col gap-1"
	transition:fade={{ duration: settings.GRAPH_ANIMATION_DURATION }}
>
	{#if !graphView.isLectures()}
		<Button
			class="size-8 rounded-xl"
			onclick={() => {
				graphD3.centerOnGraph();
			}}
			size="icon"
		>
			<SearchSlash />
		</Button>
		<Button class="size-8 rounded-xl" onclick={() => graphD3.zoomIn()} size="icon">
			<ZoomIn />
		</Button>
		<Button class="size-8 rounded-xl" onclick={() => graphD3.zoomOut()} size="icon">
			<ZoomOut />
		</Button>
	{/if}

	{#if screenfull.isEnabled && document}
		<Button class="size-8 rounded-xl" onclick={toggleFullscreen}>
			{#if isFullscreen}
				<Minimize class="h-5 w-5" />
			{:else}
				<Maximize class="h-5 w-5" />
			{/if}
		</Button>
	{/if}
</div>

<!-- Simulation buttons -->
{#if editable && !graphView.isLectures() && !isFullscreen}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'absolute bottom-1 left-1')}
		>
			Simulation
			<ChevronUp />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
			<DropdownMenu.Group class="sticky top-0 z-10 mt-2 bg-white/90 backdrop-blur-md">
				<DropdownMenu.GroupHeading>
					Attention! This will move all nodes in the graph.
				</DropdownMenu.GroupHeading>

				{#if graphState.state != 'SIMULATING'}
					<DropdownMenu.Item
						disabled={graphState.state == 'TRANSITIONING'}
						onclick={() => graphD3.startSimulation()}
					>
						<Orbit /> Start simulation
					</DropdownMenu.Item>
				{:else if graphState.state == 'SIMULATING'}
					<DropdownMenu.Item
						onclick={() => {
							graphD3.stopSimulation();
							onResetSimulation();
						}}
					>
						<Orbit /> Reset simulation
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => graphD3.stopSimulation()}>
						<Orbit /> Stop simulation
					</DropdownMenu.Item>
				{/if}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
