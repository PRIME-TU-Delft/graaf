<script lang="ts">
	import { cn } from '$lib/utils';
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
		class?: string;
	};

	const { user, class: classes }: Props = $props();

	const badges = $derived.by(() => {
		const list: { label: string; count: number; isSuperAdmin?: boolean }[] = [];

		if (user.role === 'ADMIN') list.push({ label: 'Super admin', count: 1, isSuperAdmin: true });
		if (user.program_admins.length)
			list.push({ label: 'Program admin', count: user.program_admins.length });
		if (user.program_editors.length)
			list.push({ label: 'Program editor', count: user.program_editors.length });
		if (user.course_admins.length)
			list.push({ label: 'Course admin', count: user.course_admins.length });
		if (user.course_editors.length)
			list.push({ label: 'Course editor', count: user.course_editors.length });

		return list;
	});
</script>

<div class={cn('flex flex-wrap items-center gap-1', classes)}>
	{#each badges as badge (badge.label)}
		<span
			class={cn(
				'rounded border px-1.5 py-0.5 text-xs whitespace-nowrap',
				badge.isSuperAdmin
					? 'border-purple-300 bg-purple-100 font-medium text-purple-900'
					: 'border-purple-200 bg-purple-50 text-purple-800'
			)}
		>
			{badge.label}{badge.count > 1 ? ` (${badge.count})` : ''}
		</span>
	{:else}
		<span class="text-xs text-purple-500">No special privileges</span>
	{/each}
</div>
