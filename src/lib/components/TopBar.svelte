<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
	import type { Snippet } from 'svelte';

	const { children }: { children: Snippet } = $props();

	let logoMouseState = $state(-1);
	let logoClearTimeout: ReturnType<typeof setTimeout> | undefined = undefined;

	function handleLogoInteraction() {
		logoMouseState = Math.random();
		if (logoClearTimeout) {
			clearTimeout(logoClearTimeout);
		}
		logoClearTimeout = setTimeout(() => {
			logoMouseState = -1;
		}, 2000);
	}
</script>

<header class="sticky top-0 z-40 border-b border-purple-900/60 bg-white text-black">
	<div class="flex h-16 items-center justify-between gap-2 px-4 py-10 sm:px-6 md:px-12">
		<div class="flex min-w-0 items-center gap-2 sm:gap-4">
			<a
				href={resolve('/')}
				class="flex min-w-0 items-center gap-2 text-black transition-opacity hover:opacity-90 sm:gap-3"
				onmouseenter={handleLogoInteraction}
			>
				<div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-purple-900 p-1">
					<Logo mouseState={logoMouseState} class="size-6" />
				</div>
				<span class="truncate text-base font-semibold tracking-tight">Graph Editor</span>
			</a>

			<span class="hidden text-sm text-black/60 sm:inline">PRIME, TU Delft</span>
			<span class="text-sm text-black/60 sm:hidden">PRIME</span>
		</div>

		<nav class="flex shrink-0 items-center gap-1.5 sm:gap-2 md:gap-4">
			{@render children()}
		</nav>
	</div>
</header>
