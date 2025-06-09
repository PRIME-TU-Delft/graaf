<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import Input from '$lib/components/ui/input/input.svelte';
	import Label from '$lib/components/ui/label/label.svelte';
	import { cn } from '$lib/utils';
	import { Check, ChevronDown, Copy } from '@lucide/svelte';
	import type { Lecture, Link } from '@prisma/client';
	import { toast } from 'svelte-sonner';

	type GraphLinksProps = {
		link: Link;
		lectures: Lecture[];
		getLinkURL: (link: Link) => string;
	};

	const { link, lectures, getLinkURL }: GraphLinksProps = $props();

	const selectViewOptions = $derived.by(() => {
		let options = ['Domains', 'Subjects'];

		if (lectures.length > 0) {
			options = [...options, 'Lecture'];
		}

		return options;
	});

	const embedState = $state({
		show: 'Subjects' as 'Lectures' | 'Domains' | 'Subjects',
		showLecture: undefined as string | undefined,
		iframeHeight: 500
	});

	const embed = $derived.by(() => {
		const url = new URL(getLinkURL(link));

		url.searchParams.set('show', embedState.show);
		if (embedState.showLecture) {
			url.searchParams.set('lecture', embedState.showLecture);
		} else {
			url.searchParams.delete('lecture');
		}

		return {
			url: url.toString(),
			string: `<iframe width="100%"" height="${embedState.iframeHeight}px" src="${url.toString()}" frameborder="0" allowfullscreen></iframe>`
		};
	});

	let dialogOpen = $state(false);
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="code"
	variant="outline"
	button="Embed"
	title="Embed Link"
	description="Embed this link in a website or application to display the graph directly."
>
	<div class="space-y-2">
		<!-- Select view -->
		{@render selectView()}

		<!-- Select lecture -->
		{#if lectures.length > 0}
			{@render selectLecture()}
		{/if}

		<!-- Select iframeHeight -->
		<Label class="flex items-center justify-between gap-2 text-nowrap">
			Height of the iframe
			<Input type="number" class="w-32 text-right" bind:value={embedState.iframeHeight} />
		</Label>

		<div class="relative h-auto">
			<div class="h-20 w-full resize-none rounded border p-2 font-mono text-xs">
				{embed.string}
			</div>
			<Button
				variant="outline"
				class="absolute right-1 bottom-1 size-8"
				onclick={() => {
					navigator.clipboard.writeText(embed.string);
					toast.success('Embed code copied to clipboard!');
				}}
			>
				<Copy class="size-4" />
			</Button>
		</div>
	</div>
</DialogButton>

{#snippet selectView()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
		>
			<p>View: <span class="font-mono text-xs">{embedState.show}</span></p>
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-80">
			{#each selectViewOptions as option (option)}
				<DropdownMenu.Item
					class="justify-between"
					onSelect={() => (embedState.show = option as 'Lectures' | 'Domains' | 'Subjects')}
				>
					{option}
					<Check class={cn('size-4', option != embedState.show && 'text-transparent')} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

{#snippet selectLecture()}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger
			class={cn(buttonVariants({ variant: 'outline' }), 'w-full justify-between')}
		>
			<p>
				Lecture: <span class="font-mono text-xs">{embedState.showLecture ?? '(Optional)'}</span>
			</p>
			<ChevronDown />
		</DropdownMenu.Trigger>
		<DropdownMenu.Content class="w-80">
			{#each lectures.map((l) => l.name) as option (option)}
				<DropdownMenu.Item
					onSelect={() => {
						if (embedState.showLecture === option) {
							embedState.showLecture = undefined;
						} else {
							embedState.showLecture = option;
						}
					}}
					class="justify-between"
				>
					{option}
					<Check class={cn('size-4', option != embedState.showLecture && 'text-transparent')} />
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}
