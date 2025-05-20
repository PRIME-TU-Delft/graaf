<script lang="ts">
	import { fade } from 'svelte/transition';
	import { displayName } from '$lib/utils/displayUserName';
	import type { Sandbox, User } from '@prisma/client';

	type SandboxGridProps = {
		sandboxes: (Sandbox & { owner: User })[];
		user: User | undefined;
	};

	const { sandboxes, user }: SandboxGridProps = $props();
</script>

<div
	class="grid max-h-96 grid-cols-1 gap-1 overflow-auto p-2 sm:grid-cols-2 md:grid-cols-2 md:gap-2"
>
	{#each sandboxes as sandbox (sandbox.id)}
		{@render displaySandbox(sandbox)}
	{:else}
		<p class="bg-purple-100/80 p-2 col-span-3 text-purple-900 rounded">No sandboxes found.</p>
	{/each}
</div>

{#snippet displaySandbox(sandbox: SandboxGridProps['sandboxes'][number])}
	<a
		href="/graph-editor/sandboxes/{sandbox.id}"
		class="flex w-full items-center justify-between rounded border-2 border-transparent bg-purple-100/50 p-2 transition-colors hover:border-purple-200 hover:bg-purple-100"
		in:fade={{ duration: 200 }}
	>
		<div class="flex items-end gap-1">
			<p>{sandbox.name}</p>
			-
			<p>{displayName(sandbox.owner)}</p>
		</div>
	</a>
{/snippet}
