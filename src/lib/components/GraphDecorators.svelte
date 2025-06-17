<script lang="ts">
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

	import screenfull from 'screenfull';
	import { fade } from 'svelte/transition';
	import { Button, buttonVariants } from './ui/button';
	import { cn } from '$lib/utils';
	import { graphState } from '$lib/d3/GraphD3State.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import DialogButton from './DialogButton.svelte';

	type Props = {
		graphD3: GraphD3;
		editable: boolean;
		builtInViewDropdown?: boolean;
	};

	let { graphD3, editable, builtInViewDropdown = false }: Props = $props();

	let isFullscreen = $state(false);
	let lectureID = $derived(Number(page.url.searchParams.get('lectureID')) || null);
	let chosenLecture = $derived(graphD3.data.lectures.find((lecture) => lecture.id === lectureID));
	let view = $derived.by(() => {
		const param = page.url.searchParams.get('view')?.toUpperCase();
		if (param && ['DOMAINS', 'SUBJECTS', 'LECTURES'].includes(param))
			return param as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
		return 'DOMAINS';
	});

	$effect(() => {
		if (graphState.isTransitioning()) return;

		const params = new URLSearchParams({
			view: view,
			lectureID: lectureID ? String(lectureID) : ''
		}).toString();

		goto(`?${params}`);
	});

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

	function capitalize(str: string) {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}
</script>

<!-- Select View -->
{#if !isFullscreen && builtInViewDropdown}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(
				buttonVariants({ variant: 'default', size: 'lg' }),
				'fixed top-0 left-0 z-20 rounded-none rounded-ee-2xl'
			)}
		>
			{capitalize(graphView.state)}
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.GroupHeading>Change view</DropdownMenu.GroupHeading>
				{#each ['DOMAINS', 'SUBJECTS', 'LECTURES'] as tab (tab)}
					{#if tab === graphView.state}
						<DropdownMenu.Item class="justify-between" disabled>
							{capitalize(tab)}
							<Check />
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Item
							disabled={graphState.isTransitioning()}
							onclick={() => {
								view = tab as 'DOMAINS' | 'SUBJECTS' | 'LECTURES';
								graphD3.setView(view);
							}}
						>
							{capitalize(tab)}
						</DropdownMenu.Item>
					{/if}
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}

<!-- Select Lecture -->
{#if !isFullscreen && graphD3.data.lectures.length > 0}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(
				buttonVariants({ variant: 'default', size: 'lg' }),
				'fixed top-0 right-0 z-20 rounded-none rounded-es-2xl'
			)}
		>
			{chosenLecture?.name || 'Select a lecture'}
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Group>
				<DropdownMenu.Item
					onclick={() => {
						lectureID = null;
						graphD3.setLecture(null);
					}}
				>
					Unselect
					<Check class={cn('ml-auto w-auto', lectureID && 'w-0 text-transparent')} />
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				{#each graphD3.data.lectures as lecture (lecture.id)}
					<DropdownMenu.Item
						onclick={() => {
							lectureID = lecture.id;
							graphD3.setLecture(lecture);
						}}
					>
						{lecture.name}
						<Check
							class={cn('ml-auto w-auto', lecture.id !== lectureID && 'w-0 text-transparent')}
						/>
					</DropdownMenu.Item>
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}

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

<!-- AutoLayout buttons -->
{#if editable && !graphView.isLectures() && !isFullscreen}
	{#if graphState.isSimulating()}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class={cn(buttonVariants({ variant: 'default' }), 'absolute bottom-1 left-1')}
			>
				Autolayout Options
				<ChevronUp />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content class="max-h-96 max-w-64 overflow-y-auto p-0">
				<DropdownMenu.Group class="sticky top-0 z-10 mt-2 bg-white/90 backdrop-blur-md">
					<DropdownMenu.GroupHeading>Autolayout Options</DropdownMenu.GroupHeading>
					<DropdownMenu.Item onclick={() => graphD3.resetSimulation()}>
						<Orbit /> Reset simulation
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => graphD3.stopSimulation()}>
						<Orbit /> Stop simulation
					</DropdownMenu.Item>
				</DropdownMenu.Group>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<DialogButton
			button="Start Autolayout"
			title="Are you sure?"
			description="Autolayout uses a force simulation. Nodes with a dashed border will push other nodes away, and pull their neighbors closer. Clicking or moving a node locks it in place."
			variant="default"
			class="absolute bottom-1 left-1"
		>
			<div class="flex justify-end">
				<Button onclick={() => graphD3.startSimulation()}>
					<Orbit /> Start Autolayout
				</Button>
			</div>
		</DialogButton>
	{/if}
{/if}
