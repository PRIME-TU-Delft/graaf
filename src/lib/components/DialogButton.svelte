<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils';
	import { BadgeHelp, Ellipsis, Link, Pencil, Plus, Users } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { buttonVariants, type ButtonVariant } from './ui/button';

	type Props = {
		icon?: 'plus' | 'ellipsis' | 'edit' | 'admins' | 'link' | 'help';
		open?: boolean;
		button?: string;
		title: string;
		description?: string;
		disabled?: boolean;
		onclick?: (
			e: MouseEvent & {
				currentTarget: EventTarget & HTMLButtonElement;
			}
		) => void;
		children: Snippet;
		variant?: ButtonVariant;
		class?: string;
	};

	let {
		open = $bindable(false),
		icon,
		button,
		title,
		description,
		disabled,
		onclick = () => {},
		children,
		variant = 'default',
		class: classes
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={cn(
			'bg-primary hover:bg-primary/80 flex items-center gap-2 text-nowrap rounded p-2 text-sm shadow-none transition-all hover:shadow-lg',
			{ 'opacity-50': disabled },
			buttonVariants({ variant }),
			classes
		)}
		{disabled}
		onclick={(e) => {
			e.stopPropagation();
			onclick(e);
		}}
	>
		{#if icon == 'plus'}
			<Plus class="size-5" />
		{:else if icon == 'ellipsis'}
			<Ellipsis class="size-5" />
		{:else if icon == 'edit'}
			<Pencil class="size-5" />
		{:else if icon == 'admins'}
			<Users class="size-5" />
		{:else if icon == 'link'}
			<Link class="size-5" />
		{:else if icon == 'help'}
			<BadgeHelp class="size-5" />
		{/if}

		{#if button}
			<span>{button}</span>
		{/if}
	</Dialog.Trigger>

	<Dialog.Content class="max-h-[80dvh] max-w-2xl overflow-y-auto p-0">
		<Dialog.Header class="sticky top-0 z-10 bg-white/50 p-4 backdrop-blur-lg">
			<Dialog.Title class="text-lg">{title}</Dialog.Title>
			{#if description}
				<Dialog.Description class="text-md">
					{description}
				</Dialog.Description>
			{/if}
		</Dialog.Header>

		<div class="p-4">
			{@render children()}
		</div>
	</Dialog.Content>
</Dialog.Root>
