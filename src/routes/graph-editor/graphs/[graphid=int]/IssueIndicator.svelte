
<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
    import { TriangleAlert, CircleAlert } from '@lucide/svelte';
    import type { Issue } from '$lib/validators/types';

    type Props = { issues: Issue[] };
    let { issues }: Props = $props();

    let severity = $derived.by(() => {
        if (issues.length === 0) return 'none';
        if (issues.some(issue => issue.severity === 'error')) return 'error';
        return 'warning';
    });

</script>

{#if severity !== 'none'}
    <Popover.Root>
        {#if severity === 'error'}
            <Popover.Trigger
                class="p-1 rounded bg-red-300/35 text-red-900 transition-colors cursor-pointer hover:bg-red-300"
            >
                <TriangleAlert />
            </Popover.Trigger>
        {:else if severity === 'warning'}
            <Popover.Trigger 
                class="p-1 rounded bg-yellow-300/35 text-yellow-900 transition-colors cursor-pointer hover:bg-yellow-300"
            >
                <CircleAlert />
            </Popover.Trigger>
        {/if}

    	<Popover.Content side="right" class="py-0 px-4 divide-y divide-gray-200">
            {#each issues as issue}
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