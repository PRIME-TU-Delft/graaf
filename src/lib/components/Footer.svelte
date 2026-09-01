<script lang="ts">
	import Logo from '$lib/components/Logo.svelte';
</script>

<footer class="bg-slate-900 py-10 text-slate-400">
	<div class="px-4 sm:px-6 md:px-12">
		<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
			<div class="flex items-center gap-2.5">
				<div class="flex size-7 items-center justify-center rounded-md bg-purple-950 p-1">
					<Logo mouseState={-1} class="size-4" />
				</div>
				<span class="text-sm font-medium text-white">PRIME Graph Editor</span>
			</div>

			<div class="flex flex-wrap items-center justify-center gap-5 text-xs">
				<a
					href="https://prime-tu-delft.github.io/graaf/"
					target="_blank"
					rel="noreferrer"
					class="hover:text-white"
				>
					Manual
				</a>
				<a
					href="https://github.com/PRIME-TU-Delft/graaf"
					target="_blank"
					rel="noreferrer"
					class="hover:text-white"
				>
					GitHub
				</a>
				<a
					href="https://www.tudelft.nl/prime"
					target="_blank"
					rel="noreferrer"
					class="hover:text-white"
				>
					PRIME TU Delft
				</a>
				<a
					href="https://github.com/PRIME-TU-Delft/graaf/blob/main/LICENSE"
					target="_blank"
					rel="noreferrer"
					class="hover:text-white"
				>
					License
				</a>
			</div>
		</div>

		<div
			class="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-xs text-slate-500 sm:flex-row"
		>
			<div class="flex items-center gap-2">
				<a
					rel="license"
					href="https://creativecommons.org/licenses/by/4.0/"
					target="_blank"
					class="shrink-0 opacity-80 hover:opacity-100"
				>
					<img
						alt="Creative Commons License"
						class="h-5"
						src="https://i.creativecommons.org/l/by/4.0/88x31.png"
					/>
				</a>
				<span>
					Licensed under
					<a
						href="https://creativecommons.org/licenses/by/4.0/"
						class="underline hover:text-slate-300"
						target="_blank"
						rel="noreferrer"
					>
						CC BY 4.0
					</a>
				</span>
			</div>
			<p>
				Based on
				<a
					href="https://github.com/PRIME-TU-Delft/graaf"
					class="underline hover:text-slate-300"
					target="_blank"
					rel="noreferrer"
				>
					PRIME-TU-Delft/graaf
				</a>
			</p>
		</div>
	</div>
</footer>
