<script lang="ts" generics="T extends Schema">
	import { type Schema } from 'sveltekit-superforms';

	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Plus from 'lucide-svelte/icons/plus';
	import type { Snippet } from 'svelte';

	type Props = {
		icon: string;
		open: boolean;
		button: string;
		title: string;
		description: string;
		disabled?: boolean;
		children: Snippet;
	};

	let {
		open = $bindable(),
		icon,
		button,
		title,
		description,
		disabled,
		children
	}: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="flex items-center gap-2 text-nowrap rounded bg-primary p-2 text-sm text-primary-foreground shadow-none transition-all hover:bg-primary/80 hover:shadow-lg sm:text-base {disabled
			? 'opacity-50'
			: ''}"
		{disabled}
	>
		<div class="hidden sm:block">
			{#if icon == 'plus'}
				<Plus class="size-5" />
			{/if}
		</div>

		<span>{button}</span>
	</Dialog.Trigger>

	<Dialog.Content class="max-w-2xl">
		<Dialog.Header>
			<Dialog.Title class="text-lg">{title}</Dialog.Title>
			<Dialog.Description class="text-md">
				{description}
			</Dialog.Description>
		</Dialog.Header>

		{@render children()}
	</Dialog.Content>
</Dialog.Root>
