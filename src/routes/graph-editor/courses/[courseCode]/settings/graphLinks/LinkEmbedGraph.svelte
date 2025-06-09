<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import type { CoursePermissions } from '$lib/utils/permissions';
	import { Check, ChevronDown, Code, Copy } from '@lucide/svelte';
	import type { Course, Graph, Lecture, Link } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	import AddAliasLink from './AddAliasLink.svelte';
	import DeleteAliasLink from './DeleteAliasLink.svelte';
	import { EmbedState } from './GraphEmbedState.svelte';
	import MoveAliasLink from './MoveAliasLink.svelte';

	type GraphLinksProps = {
		graph: Graph & { lectures: Lecture[]; links: Link[] };
		course: Course &
			CoursePermissions & {
				graphs: Graph[];
				links: Link[];
			};
		longName?: boolean;
		hasAtLeastEditPermission: boolean;
	};

	const { graph, course, hasAtLeastEditPermission }: GraphLinksProps = $props();

	let links = $derived(graph.links.map((link) => link));

	let graphLinkSettingsOpen = $state(false);

	function handleOpenGraphSettings(e: MouseEvent) {
		e.preventDefault();
		graphLinkSettingsOpen = true;
	}

	function getEmbedUrl(graphEmbedState: EmbedState) {
		const url = new URL(`${page.url.host}/graph/${course.code}/${graphEmbedState.alias}`);

		url.searchParams.set('show', graphEmbedState.show);

		if (graphEmbedState.show == 'Lecture' && graphEmbedState.showLecture) {
			url.searchParams.set('lecture', graphEmbedState.showLecture);
		} else {
			url.searchParams.delete('lecture');
		}

		const pre = `<iframe width="100%"" height="${graphEmbedState.iframeHeight}px" src="`;
		const post = `" frameborder="0" allowfullscreen></iframe>`;
		return { pre, url: url.toString(), post };
	}

	let selectViewOptions = $derived.by(() => {
		let options = ['Domains', 'Subjects'];

		if (graph.lectures.length > 0) {
			options = [...options, 'Lecture'];
		}

		return options;
	});
</script>

<DialogButton
	bind:open={graphLinkSettingsOpen}
	onclick={(e) => handleOpenGraphSettings(e)}
	icon="link"
	description="A link can be used to make a graph visible to students. Each link needs a unique name within a
			course. When a link is created, it will be visible to all students."
	button="Link"
	title="Graph link settings"
	class="grow"
>
	{#if hasAtLeastEditPermission}
		<p class="text-sm"></p>
		<div class="my-2 grid grid-cols-1 gap-x-4 gap-y-2">
			{#each links as link (link.id || link.name)}
				<div in:fade class="flex w-full items-center justify-between gap-1">
					<p class="w-full rounded border border-blue-100 bg-blue-50/50 p-2">{link.name}</p>

					{#if course.graphs.length > 1}
						<MoveAliasLink {course} {graph} graphs={course.graphs} {link} />
					{/if}

					{@render embed(link)}

					<DeleteAliasLink {course} {graph} {link} />
				</div>
			{/each}
		</div>

		{#key links}
			<AddAliasLink
				{course}
				{graph}
				onSuccess={(link) => {
					links.push(link);
				}}
			/>
		{/key}
	{/if}
</DialogButton>

{#snippet embed(link: Link)}
	{@const graphEmbedState = new EmbedState(link.name)}
	{@const embedUrl = getEmbedUrl(graphEmbedState)}
	{@const embedUrlString = `${embedUrl.pre}${embedUrl.url}${embedUrl.post}`}

	<Popover.Root bind:open={graphEmbedState.isOpen}>
		<Popover.Trigger class={cn(buttonVariants({ variant: 'default' }))}><Code /></Popover.Trigger>
		<Popover.Content class="w-96 space-y-2 p-4" align="start" sideOffset={8}>
			<!-- Select view mode -->
			{@render selectView(graphEmbedState)}

			<!-- Show lecture -->
			{#if graph.lectures.length > 0}
				{@render selectLecture(graphEmbedState)}
			{/if}

			<Label class="flex items-center justify-between gap-2 text-nowrap">
				Height of the iframe
				<Input type="number" class="w-32 text-right" bind:value={graphEmbedState.iframeHeight} />
			</Label>

			<div class="relative h-auto">
				<div class="h-20 w-full resize-none rounded border p-2 font-mono text-xs">
					{embedUrl.pre}<span class="font-bold">{embedUrl.url}</span>{embedUrl.post}
				</div>
				<Button
					variant="outline"
					class="absolute right-1 bottom-1 size-8"
					onclick={() => {
						navigator.clipboard.writeText(embedUrlString);
						graphEmbedState.isOpen = false;
						toast.success('Link copied to clipboard!');
					}}
				>
					<Copy class="size-4" />
				</Button>
			</div>
		</Popover.Content>
	</Popover.Root>
{/snippet}

{#snippet selectView(state: EmbedState)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
		>
			<p>View: <span class="font-mono text-xs">{state.show}</span></p>
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-80">
			{#each selectViewOptions as v (v)}
				<DropdownMenu.Item onSelect={() => EmbedState.selectShow(state, v)} class="justify-between">
					{v}
					<Check class={cn('size-4', v != state.show && 'text-transparent')} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet selectLecture(state: EmbedState)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
		>
			<p>Lecture: <span class="font-mono text-xs">{state.showLecture ?? '(Optional)'}</span></p>
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-80">
			{#each graph.lectures.map((l) => l.name) as v (v)}
				<DropdownMenu.Item
					onSelect={() => EmbedState.selectShowLecture(state, v)}
					class="justify-between"
				>
					{v}
					<Check class={cn('size-4', v != state.showLecture && 'text-transparent')} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
