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

<header class="sticky top-0 z-40 border-b border-purple-900/60 bg-purple-950 text-white">
	<div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
		<a
			href={resolve('/')}
			class="flex items-center gap-3 text-white transition-opacity hover:opacity-90"
			onmouseenter={handleLogoInteraction}
		>
			<div class="flex size-9 items-center justify-center rounded-md bg-purple-900 p-1">
				<Logo mouseState={logoMouseState} class="size-6" />
			</div>
			<span class="text-base font-semibold tracking-tight">PRIME Graph Editor</span>
		</a>

		<nav class="flex items-center gap-2 sm:gap-4">
			{@render children()}
		</nav>
	</div>
</header>
