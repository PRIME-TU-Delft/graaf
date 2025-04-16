<script lang="ts">
	import { displayName } from '$lib/utils/displayUserName';
	import { fade } from 'svelte/transition';
	import { Prisma } from '@prisma/client';

	type CourseGridProps = {
		sandboxes: Prisma.SandboxGetPayload<{ include: { owner: true } }>[];
	};

	const { sandboxes }: CourseGridProps = $props();
</script>

<div
	class="grid max-h-96 grid-cols-1 gap-1 overflow-auto p-2 sm:grid-cols-2 md:grid-cols-2 md:gap-2"
>
	{#each sandboxes as sandbox (sandbox.id)}
		{@render displaySandbox(sandbox)}
	{:else}
		<p class="bg-white/80 p-2 col-span-3 text-slate-900/60 rounded">You have no Sandboxes</p>
	{/each}
</div>

{#snippet displaySandbox(sandbox: CourseGridProps['sandboxes'][number])}
	<a
		href="graph-editor/sandboxes/{sandbox.id}"
		class="flex w-full items-center justify-between rounded border-2 bg-white/90 p-2 transition-colors hover:border-blue-200 hover:bg-blue-50"
		in:fade={{ duration: 200 }}
	>
		<p>{sandbox.name}</p>
		<p class="text-xs text-blue-900">{displayName(sandbox.owner, 'No owner')}</p>
	</a>
{/snippet}
