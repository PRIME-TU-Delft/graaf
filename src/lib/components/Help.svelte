<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { manualLabel, manualUrl, type ManualPage } from '$lib/manual';
	import { BadgeHelp } from '@lucide/svelte';

	type Props = {
		page: ManualPage;
	};

	const { page }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- external manual link, not a SvelteKit route -->
<a
	href={manualUrl(page)}
	target="_blank"
	rel="noopener noreferrer"
	class={cn(
		'flex items-center gap-2 rounded p-2 text-sm text-nowrap shadow-none transition-all hover:shadow-lg',
		buttonVariants({ variant: 'default' }),
		'fixed top-2 right-4 z-20 gap-1 bg-transparent text-white hover:underline'
	)}
>
	<BadgeHelp class="size-5" />
	<span>{manualLabel(page)} help</span>
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
