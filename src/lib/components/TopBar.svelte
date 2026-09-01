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
	<div class="flex h-16 items-center justify-between px-12 py-10">
		<div class="flex items-center gap-4">
			<a
				href={resolve('/')}
				class="flex items-center gap-3 text-black transition-opacity hover:opacity-90"
				onmouseenter={handleLogoInteraction}
			>
				<div class="flex size-9 items-center justify-center rounded-md bg-purple-900 p-1">
					<Logo mouseState={logoMouseState} class="size-6" />
				</div>
				<span class="text-base font-semibold tracking-tight">Graph Editor</span>
			</a>

			<span class="text-sm text-black/60">PRIME, TU Delft</span>
		</div>

		<nav class="flex items-center gap-2 sm:gap-4">
			{@render children()}
		</nav>
	</div>
</header>
