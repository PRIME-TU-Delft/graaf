<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import Plus from 'lucide-svelte/icons/plus';
	import type { Snippet } from 'svelte';

	type Props = {
		triggerName: string;
		title: string;
		description: string;
		icon?: 'plus';
		open?: boolean;
		children: Snippet;
	};

	let { triggerName, title, description, icon, open = $bindable(), children }: Props = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class="flex items-center gap-2 rounded bg-primary p-2 text-primary-foreground shadow-none transition-all hover:bg-primary/80 hover:shadow-lg"
	>
		{#if icon == 'plus'}
			<Plus class="size-5" />
		{/if}

		<span>{triggerName}</span></Dialog.Trigger
	>
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
