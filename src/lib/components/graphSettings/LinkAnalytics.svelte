<script lang="ts">
	import { formatAcademicWeekLong } from '$lib/utils/academicWeeks';

	// Components
	import * as Table from '$lib/components/ui/table/index.js';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import LinkViewsChart from '$lib/components/graphSettings/LinkViewsChart.svelte';

	// Types
	import type { Link } from '@prisma/client';
	import type { LinkAnalytics } from '$lib/utils/linkAnalytics';

	type LinkAnalyticsProps = {
		link: Link;
		analytics: LinkAnalytics;
		url: string;
	};

	const { link, analytics, url }: LinkAnalyticsProps = $props();

	/** Only the weeks that actually have views, newest first. Carries the same numbers as the
	 * chart, for anyone who would rather read them than look at bars. */
	const weeksWithViews = $derived([...analytics.weeks.filter((week) => week.count > 0)].reverse());

	let dialogOpen = $state(false);
</script>

<DialogButton
	bind:open={dialogOpen}
	icon="chart"
	variant="outline"
	button="Analytics"
	title="Views of {link.name}"
	description={url}
	contentClass="sm:max-w-4xl scrollbar-subtle"
>
	<div class="space-y-4">
		<div class="grid grid-cols-2 gap-2">
			<div class="rounded-md border p-3">
				<p class="text-sm text-gray-500">Total views</p>
				<p class="text-3xl font-semibold text-purple-950">{analytics.total}</p>
				<p class="text-xs text-gray-400">Since this link was created</p>
			</div>

			<div class="rounded-md border p-3">
				<p class="text-sm text-gray-500">Last {analytics.windowWeeks} weeks</p>
				<p class="text-3xl font-semibold text-purple-950">{analytics.recentViews}</p>
				{#if analytics.isStale}
					<p class="text-xs text-amber-700">
						Under the stale threshold of {analytics.threshold}
					</p>
				{:else}
					<p class="text-xs text-gray-400">Stale below {analytics.threshold}</p>
				{/if}
			</div>
		</div>

		<LinkViewsChart weeks={analytics.weeks} />

		{#if weeksWithViews.length > 0}
			<div class="scrollbar-subtle max-h-56 overflow-y-auto rounded-md border">
				<Table.Root class="!m-0">
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="w-full">Week</Table.Head>
							<Table.Head class="text-right">Views</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each weeksWithViews as week (week.weekStart.getTime())}
							<Table.Row class="hover:bg-transparent">
								<Table.Cell class="text-xs">{formatAcademicWeekLong(week.weekStart)}</Table.Cell>
								<Table.Cell class="text-right tabular-nums">{week.count}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}

		<p class="text-xs text-gray-400">
			Views are counted per visit of the public link, without recording anything about who visited.
			Opening a graph from the graph editor is not counted.
		</p>
	</div>
</DialogButton>
