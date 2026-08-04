<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import { TriangleAlert, CircleAlert } from '@lucide/svelte';
	import type { Issue } from '$lib/validators/types';

	type Props = { issues: Issue[] };
	let { issues }: Props = $props();

	let severity = $derived.by(() => {
		if (issues.length === 0) return 'none';
		if (issues.some((issue) => issue.severity === 'error')) return 'error';
		return 'warning';
	});
</script>

{#if severity !== 'none'}
	<Popover.Root>
		<Popover.Trigger
			class={cn('cursor-pointer rounded p-1 transition-colors', {
				'bg-red-300/35 text-red-900 hover:bg-red-300': severity === 'error',
				'bg-yellow-300/35 text-yellow-900 hover:bg-yellow-300': severity === 'warning'
			})}
		>
			{#if severity === 'error'}
				<TriangleAlert />
			{:else}
				<CircleAlert />
			{/if}
		</Popover.Trigger>

		<Popover.Content side="right" class="divide-y divide-gray-200 px-4 py-0">
			{#each issues as issue (issue.id)}
				{@render issueCard(issue)}
			{/each}
		</Popover.Content>
	</Popover.Root>
{/if}

{#snippet issueCard(issue: Issue)}
	<div class="flex items-start gap-2 py-4">
		{#if issue.severity === 'error'}
			<TriangleAlert class="text-red-600" />
		{:else if issue.severity === 'warning'}
			<CircleAlert class="text-yellow-600" />
		{/if}

		<div>
			<p class="text-sm font-semibold">{issue.title}</p>
			<p class="text-sm text-gray-700">{issue.message}</p>
		</div>
	</div>
{/snippet}
