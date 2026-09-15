<script lang="ts">
	import * as d3 from 'd3';
	import { formatWeek, formatWeekLong } from '$lib/utils/weeks';
	import { formatViewCount } from '$lib/utils/linkAnalytics';

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

	/** Height of the plotted area, in the SVG's own viewBox units. The viewBox's width tracks
	 * `weeks.length` instead, so each bar is exactly one unit wide and the chart stays crisp at
	 * any container width without measuring it. */
	const VIEW_HEIGHT = 100;
	/** Gap between bars, in viewBox units, i.e. a fraction of one bar's width */
	const BAND_PADDING = 0.15;
	/** Shortest a non-zero bar is ever drawn, in viewBox units, so a small count next to a much
	 * bigger peak still shows as a sliver rather than nothing */
	const MIN_BAR_HEIGHT = 1.5;

	let hovered = $state<number | null>(null);

	const peak = $derived(d3.max(weeks, (week) => week.count) ?? 0);

	/** Top of the scale, rounded up to the next half order of magnitude so it reads as a round
	 * number rather than as the exact peak. */
	const top = $derived.by(() => {
		if (peak <= 2) return 2;

		const step = 10 ** Math.floor(Math.log10(peak)) / 2;
		return Math.ceil(peak / step) * step;
	});

	const x = $derived(
		d3
			.scaleBand<number>()
			.domain(d3.range(weeks.length))
			.range([0, weeks.length])
			.paddingInner(BAND_PADDING)
	);
	const y = $derived(d3.scaleLinear().domain([0, top]).range([VIEW_HEIGHT, 0]));

	const ticks = $derived([
		{ value: top, y: y(top), label: `${top}` },
		{ value: top / 2, y: y(top / 2), label: '' },
		{ value: 0, y: y(0), label: '0' }
	]);

	const readout = $derived.by(() => {
		if (hovered != null) {
			const week = weeks[hovered];
			return `${formatWeekLong(week.weekStart)}: ${formatViewCount(week.count)}`;
		}

		if (peak === 0) return `No views in the last ${weeks.length} weeks`;

		const peakIndex = weeks.findIndex((week) => week.count === peak);
		return `Busiest week: ${peak} views in ${formatWeekLong(weeks[peakIndex].weekStart)}`;
	});
</script>

<figure class="!m-0 space-y-2">
	<figcaption class="text-sm text-gray-500">Views per week, last {weeks.length} weeks</figcaption>

	<p class="text-primary min-h-10 text-sm">{readout}</p>

	<div class="relative h-40 pl-8">
		<!-- Scale: a labelled top and baseline, with a hairline halfway between -->
		{#each ticks as tick (tick.value)}
			<div
				class="pointer-events-none absolute inset-x-0 flex -translate-y-1/2 items-center gap-1"
				style="top: {(tick.y / VIEW_HEIGHT) * 100}%"
			>
				<span class="w-7 shrink-0 text-right text-[10px] text-gray-400 tabular-nums">
					{tick.label}
				</span>
				<div class="h-px grow bg-gray-200"></div>
			</div>
		{/each}

		<svg
			class="h-full w-full"
			viewBox="0 0 {weeks.length} {VIEW_HEIGHT}"
			preserveAspectRatio="none"
			role="presentation"
		>
			{#each weeks as week, index (week.weekStart.getTime())}
				{@const barX = x(index) ?? 0}
				{@const barY = y(week.count)}
				<g>
					<!-- Hit target spans the full column height, so hover works below the bar too -->
					<rect
						x={barX}
						y={0}
						width={x.bandwidth()}
						height={VIEW_HEIGHT}
						fill="transparent"
						class="hover:fill-purple-100/70 focus-visible:fill-purple-100/70 focus-visible:outline-none"
						tabindex={week.count > 0 ? 0 : -1}
						role="button"
						aria-label="{formatWeekLong(week.weekStart)}: {week.count} views"
						onmouseenter={() => (hovered = index)}
						onmouseleave={() => (hovered = null)}
						onfocus={() => (hovered = index)}
						onblur={() => (hovered = null)}
					/>
					{#if week.count > 0}
						{@const barHeight = Math.max(MIN_BAR_HEIGHT, VIEW_HEIGHT - barY)}
						<rect
							x={barX}
							y={VIEW_HEIGHT - barHeight}
							width={x.bandwidth()}
							height={barHeight}
							class="fill-primary pointer-events-none"
						/>
					{/if}
				</g>
			{/each}
		</svg>
	</div>

	<div class="flex gap-[2px] pl-8">
		{#each weeks as week, index (week.weekStart.getTime())}
			<span class="min-w-0 grow text-center text-[10px] whitespace-nowrap text-gray-400">
				{index % LABEL_EVERY === LABEL_OFFSET ? formatWeek(week.weekStart) : ''}
			</span>
		{/each}
	</div>
</figure>
