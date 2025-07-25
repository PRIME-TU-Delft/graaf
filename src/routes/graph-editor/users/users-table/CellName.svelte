<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';
	import { ShieldUser } from '@lucide/svelte';
	import type { DataUser } from './userTableColumns';
	import * as HoverCard from '$lib/components/ui/hover-card';
	import * as Tooltip from '$lib/components/ui/tooltip';

	type Props = {
		row: DataUser;
	};

	const { row }: Props = $props();
</script>

<div class="flex items-center gap-2 font-medium">
	{#if row.role == 'ADMIN'}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger class="bg-primary  rounded p-1 text-white ">
					<ShieldUser class="size-4" />
				</Tooltip.Trigger>
				<Tooltip.Content side="bottom">Admin user</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}

	{displayName(row)}
</div>
