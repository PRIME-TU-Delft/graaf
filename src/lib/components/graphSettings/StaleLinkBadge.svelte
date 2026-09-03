<script lang="ts">
	// Components
	import * as Popover from '$lib/components/ui/popover';

	// Icons
	import { TrendingDown } from '@lucide/svelte';

	// Types
	import type { LinkAnalytics } from '$lib/utils/linkAnalytics';

	type StaleLinkBadgeProps = {
		analytics: LinkAnalytics;
	};

	const { analytics }: StaleLinkBadgeProps = $props();

	const views = $derived(analytics.recentViews === 1 ? '1 view' : `${analytics.recentViews} views`);
</script>

<Popover.Root>
	<Popover.Trigger
		class="flex items-center gap-1 rounded border border-dashed border-amber-600 bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800 hover:bg-amber-100"
	>
		<TrendingDown class="size-3.5" />
		<span>Stale</span>
	</Popover.Trigger>
	<Popover.Content class="w-80 space-y-1 text-sm">
		<p class="font-bold">Hardly used lately</p>
		<p>
			This link got {views} in the last {analytics.windowWeeks} weeks. Anything under {analytics.threshold}
			views in that period is marked stale.
		</p>
		<p class="text-gray-500">
			Nothing happens to a stale link, it keeps working. It is only flagged here so you can decide
			whether to keep sharing it.
		</p>
	</Popover.Content>
</Popover.Root>
