<script lang="ts">
	import { formatWeek, formatWeekLong } from '$lib/utils/weeks';

	// Types
	import type { ViewWeek } from '$lib/utils/linkAnalytics';

	type LinkViewsChartProps = {
		/** Dense week series, oldest first, weeks without views included as zeroes */
		weeks: ViewWeek[];
	};

	const { weeks }: LinkViewsChartProps = $props();

	/** Label every 8th week, offset from the edges so no label hangs off the chart */
	const LABEL_EVERY = 8;
	const LABEL_OFFSET = 2;

	let hovered = $state<number | null>(null);

	const peak = $derived(
		weeks.reduce(
			(best, week) => (week.count > best.count ? week : best),
			weeks[0] ?? { weekStart: new Date(0), count: 0 }
		)
	);

	/** Top of the scale, rounded up to the next half order of magnitude so it reads as a round
	 * number rather than as the exact peak. */
	const top = $derived.by(() => {
		if (peak.count <= 2) return 2;

		const step = 10 ** Math.floor(Math.log10(peak.count)) / 2;
		return Math.ceil(peak.count / step) * step;
	});

	const ticks = $derived([
		{ height: 100, label: `${top}` },
		{ height: 50, label: '' },
		{ height: 0, label: '0' }
	]);

	const readout = $derived.by(() => {
		if (hovered != null) {
			const week = weeks[hovered];
			const views = week.count === 1 ? '1 view' : `${week.count} views`;
			return `${formatWeekLong(week.weekStart)}: ${views}`;
		}

		if (peak.count === 0) return `No views in the last ${weeks.length} weeks`;
		return `Busiest week: ${peak.count} views in ${formatWeekLong(peak.weekStart)}`;
	});
</script>

<figure class="!m-0 space-y-2">
	<figcaption class="text-sm text-gray-500">Views per week, last {weeks.length} weeks</figcaption>

	<p class="text-primary min-h-10 text-sm">{readout}</p>

	<div class="relative h-40 pl-8">
		<!-- Scale: a labelled top and baseline, with a hairline halfway between -->
		{#each ticks as tick (tick.height)}
			<div
				class="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center gap-1"
				style="top: {100 - tick.height}%"
			>
				<span class="w-7 shrink-0 text-right text-[10px] text-gray-400 tabular-nums">
					{tick.label}
				</span>
				<div class="h-px grow bg-gray-200"></div>
			</div>
		{/each}

		<div class="relative flex h-full gap-[2px]">
			{#each weeks as week, index (week.weekStart.getTime())}
				<button
					type="button"
					class="relative h-full min-w-0 grow rounded-t transition-colors hover:bg-purple-100/70 focus-visible:bg-purple-100/70 focus-visible:outline-none"
					tabindex={week.count > 0 ? 0 : -1}
					aria-label="{formatWeekLong(week.weekStart)}: {week.count} views"
					onmouseenter={() => (hovered = index)}
					onmouseleave={() => (hovered = null)}
					onfocus={() => (hovered = index)}
					onblur={() => (hovered = null)}
				>
					{#if week.count > 0}
						<span
							class="bg-primary absolute bottom-0 left-1/2 w-full max-w-6 -translate-x-1/2 rounded-t-[4px]"
							style="height: max(2px, {(week.count / top) * 100}%)"
						></span>
					{/if}
				</button>
			{/each}
		</div>
	</div>

	<div class="flex gap-[2px] pl-8">
		{#each weeks as week, index (week.weekStart.getTime())}
			<span class="min-w-0 grow text-center text-[10px] whitespace-nowrap text-gray-400">
				{index % LABEL_EVERY === LABEL_OFFSET ? formatWeek(week.weekStart) : ''}
			</span>
		{/each}
	</div>

	<p class="text-xs text-gray-400">
		Week numbers are ISO week numbers. Every week runs Monday to Sunday.
	</p>
</figure>
