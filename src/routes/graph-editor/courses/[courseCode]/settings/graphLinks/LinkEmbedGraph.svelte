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
	import { graphEmbedState } from './GraphEmbedState.svelte';
	import GraphLinkSettings from './GraphLinkSettings.svelte';

	type GraphLinksProps = {
		graph: Graph & { lectures: Lecture[]; links: Link[] };
		course: Course &
			CoursePermissions & {
				graphs: Graph[];
				links: Link[];
			};
		longName?: boolean;
		hasAtLeastCourseEditPermissions: boolean;
	};

	const {
		graph,
		course,
		longName = false,
		hasAtLeastCourseEditPermissions
	}: GraphLinksProps = $props();

	let popoverOpen = $state(false);
	let graphLinkSettingsOpen = $state(false);

	function handleOpenGraphSettings(e: MouseEvent) {
		e.preventDefault();
		graphLinkSettingsOpen = true;
	}

	const embedUrl = $derived.by(() => {
		if (graphEmbedState.alias == undefined) {
			return { error: 'Select a graph link' };
		}

		const url = new URL(`${page.url.host}/graph/${course.code}/${graphEmbedState.alias}`);

		url.searchParams.set('show', graphEmbedState.show);

		if (graphEmbedState.show == 'Lecture' && graphEmbedState.showLecture) {
			url.searchParams.set('lecture', graphEmbedState.showLecture);
		} else {
			url.searchParams.delete('lecture');
		}

		const pre = `<iframe width="100%"" height="${graphEmbedState.iframeHeight}" src="`;
		const post = `" frameborder="0" allowfullscreen></iframe>`;
		return { data: pre + url.toString() + post };
	});

	let selectViewOptions = $derived.by(() => {
		let options = ['Domains', 'Subjects'];

		if (graph.lectures.length > 0) {
			options = [...options, 'Lecture'];
		}

		return options;
	});
</script>

<div class="flex flex-col gap-1 sm:flex-row">
	<Popover.Root bind:open={popoverOpen}>
		<Popover.Trigger
			onclick={(e) => {
				e.preventDefault();
				e.stopPropagation();
				popoverOpen = !popoverOpen;
			}}
			class={cn(buttonVariants({ variant: 'default' }), 'grow')}
		>
			<Code />
			{longName ? 'Embed graph' : ''}
		</Popover.Trigger>
		<Popover.Content class="grid w-[30rem] grid-cols-1 gap-2">
			{#if graph.links.length == 0}
				<p class="col-span-2">
					Cannot embed graph because no links are created for this graph. Add one in the settings
					panel of this graph.
				</p>
			{:else}
				<div class="space-y-1">
					<!-- Select alias -->
					{@render select(
						'Link',
						graphEmbedState.alias ?? 'Select a link name',
						graph.links.map((link) => link.name),
						graphEmbedState.selectAlias
					)}

					<!-- Select view mode -->
					{@render select(
						'View',
						graphEmbedState.show,
						selectViewOptions,
						graphEmbedState.selectShow
					)}

					<!-- Show lecture -->
					{#if graph.lectures.length > 0}
						{@render select(
							'Lecture Highlight',
							graphEmbedState.showLecture ?? '(optional)',
							graph.lectures.map((lecture) => lecture.name),
							graphEmbedState.selectShowLecture
						)}
					{/if}

					<Label class="flex items-center justify-between gap-2 text-nowrap">
						Height of the iframe
						<Input
							type="number"
							class="w-32 text-right"
							bind:value={graphEmbedState.iframeHeight}
						/>
					</Label>
				</div>

				<div class="relative h-auto">
					<textarea readonly class="h-20 w-full resize-none rounded font-mono text-xs"
						>{embedUrl.error ?? embedUrl.data}</textarea
					>
					{#if embedUrl.data}
						<Button
							variant="outline"
							class="absolute right-1 bottom-3 size-8"
							onclick={() => {
								navigator.clipboard.writeText(embedUrl.data);
								toast.success('Link copied to clipboard!');
							}}
						>
							<Copy class="size-4" />
						</Button>
					{/if}
				</div>
			{/if}
		</Popover.Content>
	</Popover.Root>

	{#if hasAtLeastCourseEditPermissions}
		<DialogButton
			bind:open={graphLinkSettingsOpen}
			onclick={(e) => handleOpenGraphSettings(e)}
			icon="link"
			button="Link"
			title="Graph link settings"
			class="grow"
		>
			<GraphLinkSettings
				{course}
				{graph}
				graphs={course.graphs}
				onSuccess={() => (graphLinkSettingsOpen = false)}
			/>
		</DialogButton>
	{/if}
</div>

{#snippet select(name: string, value: string, values: string[], select: (value: string) => void)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
		>
			<p>{name}: <span class="font-mono text-xs">{value}</span></p>
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-80">
			{#each values as v (v)}
				<DropdownMenu.Item onSelect={() => select(v)} class="justify-between">
					{v}
					<Check class={cn('size-4', v != value && 'text-transparent')} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
