<script lang="ts">
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/Logo.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		ArrowRight,
		BookOpen,
		ExternalLink,
		FlaskRound,
		Layers,
		LogIn,
		Network,
		Share2
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

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

	interface Contributor {
		name: string;
		title: string;
		githubUsername?: string;
		githubUrl?: string;
		image?: string;
		initials: string;
	}

	const contributors: Contributor[] = [
		{
			name: 'Abel de Bruijn',
			title: 'Developer',
			githubUsername: 'abeldebruijn',
			githubUrl: 'https://github.com/abeldebruijn',
			image: '/contributors/abel-de-bruijn.jpg',
			initials: 'AD'
		},
		{
			name: 'Bram Kreulen',
			title: 'Developer',
			githubUsername: 'Bluerberry',
			githubUrl: 'https://github.com/Bluerberry',
			initials: 'BK'
		},
		{
			name: 'Julia van der Kris',
			title: 'Migration and Devops expert',
			githubUsername: 'juliavdkris',
			githubUrl: 'https://github.com/juliavdkris',
			initials: 'JK'
		},
		{
			name: 'Boris Pavic',
			title: 'Developer',
			githubUsername: 'BorisPST',
			githubUrl: 'https://github.com/BorisPST',
			initials: 'BP'
		},
		{
			name: 'Daniela Petrova',
			title: 'Coordinator',
			initials: 'DP'
		},
		{
			name: 'Bartek Włodarczyk',
			title: 'Developer',
			githubUsername: 'bewuwy',
			githubUrl: 'https://github.com/bewuwy',
			image: '/contributors/bartek-wlodarczyk.jpg',
			initials: 'BW'
		}
	];

	const features = [
		{
			title: 'Curriculum graphs',
			description:
				'Model prerequisite dependencies between domains, subjects, and lectures as directed acyclic graphs.',
			icon: Network
		},
		{
			title: 'Programmes and courses',
			description:
				'Organize multi-course programmes, manage staff permissions, and keep curriculum data structured.',
			icon: Layers
		},
		{
			title: 'Sandboxes',
			description:
				'Draft and test curriculum modifications in sandboxes before publishing them to live courses.',
			icon: FlaskRound
		},
		{
			title: 'Public links and embeds',
			description:
				'Generate read-only shareable links and embed codes to display interactive graphs for students.',
			icon: Share2
		}
	];
</script>

<svelte:head>
	<title>PRIME Graph Editor</title>
</svelte:head>

{#snippet githubIcon(className: string = 'size-4')}
	<!-- source: https://simpleicons.org/?q=github -->
	<svg
		class={className}
		fill="currentColor"
		role="img"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		><title>GitHub</title><path
			d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
		/></svg
	>
{/snippet}

<div class="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500 selection:text-white">
	<!-- Top Navigation Bar -->
	<TopBar>
		<a
			href="https://prime-tu-delft.github.io/graaf/"
			target="_blank"
			rel="noreferrer"
			class="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-purple-200 transition-colors hover:bg-purple-900 hover:text-white sm:flex"
		>
			<BookOpen class="size-4" />
			<span>Manual</span>
		</a>
		<a
			href="https://github.com/PRIME-TU-Delft/graaf"
			target="_blank"
			rel="noreferrer"
			class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-purple-200 transition-colors hover:bg-purple-900 hover:text-white"
			aria-label="GitHub Repository"
		>
			{@render githubIcon('size-4')}
			<span class="hidden sm:inline">GitHub</span>
		</a>

		{#if data.user}
			<Button
				variant="secondary"
				size="sm"
				href={resolve('/graph-editor')}
				class="bg-purple-100 font-medium text-purple-950 hover:bg-white"
			>
				<span>Open Graph Editor</span>
				<ArrowRight class="size-4" />
			</Button>
		{:else}
			<form action="?/auth" method="POST">
				<input type="hidden" name="providerId" value="surfconext" />
				<Button
					type="submit"
					size="sm"
					class="bg-purple-600 font-medium text-white hover:bg-purple-500"
				>
					<LogIn class="size-4" />
					<span>Sign in</span>
				</Button>
			</form>
		{/if}
	</TopBar>

	<!-- Hero Section -->
	<section
		class="grain relative border-b border-purple-900/60 bg-linear-to-b from-purple-950 to-slate-900 px-4 py-16 text-white sm:px-6 sm:py-24"
	>
		<div class="mx-auto max-w-4xl text-center">
			<!-- Interactive Hero Logo -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="group mx-auto mb-6 flex size-20 cursor-pointer items-center justify-center rounded-2xl border border-purple-800 bg-purple-900/80 p-3 shadow-md transition-transform duration-200 hover:scale-105 hover:border-purple-600"
				onmouseenter={handleLogoInteraction}
			>
				<Logo mouseState={logoMouseState} class="size-12" />
			</div>

			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
				Visual curriculum mapping
			</h1>

			<p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-purple-200 sm:text-lg">
				A tool developed by the <a
					href="https://www.tudelft.nl/prime"
					target="_blank"
					rel="noreferrer"
					class="text-purple-200 underline hover:text-white"
					>PRIME programme <ExternalLink class="inline-block size-3" /></a
				> at TU Delft for teachers and coordinators to build, explore, and share interconnected course
				graphs.
			</p>

			<!-- Hero CTAs -->
			<div class="mt-8 flex flex-wrap items-center justify-center gap-3">
				{#if data.user}
					<Button
						size="lg"
						href={resolve('/graph-editor')}
						class="bg-purple-600 font-medium text-white hover:bg-purple-500"
					>
						<span>Open Graph Editor</span>
						<ArrowRight class="size-4" />
					</Button>
				{:else}
					<form action="?/auth" method="POST">
						<input type="hidden" name="providerId" value="surfconext" />
						<Button
							type="submit"
							size="lg"
							class="bg-purple-600 font-medium text-white hover:bg-purple-500"
						>
							<LogIn class="size-4" />
							<span>Sign in with TU Delft NetID</span>
						</Button>
					</form>
				{/if}

				<Button
					variant="outline"
					size="lg"
					href="https://prime-tu-delft.github.io/graaf/"
					target="_blank"
					rel="noreferrer"
					class="border-purple-700 bg-purple-950/40 text-purple-100 hover:bg-purple-900 hover:text-white"
				>
					<BookOpen class="size-4" />
					<span>Read manual</span>
					<ExternalLink class="size-3.5 opacity-60" />
				</Button>

				<Button
					variant="ghost"
					size="lg"
					href="https://github.com/PRIME-TU-Delft/graaf"
					target="_blank"
					rel="noreferrer"
					class="text-purple-200 hover:bg-purple-900/60 hover:text-white"
				>
					{@render githubIcon('size-4')}
					<span>GitHub</span>
				</Button>
			</div>
		</div>
	</section>

	<!-- Interactive Example Graph Section -->
	<section class="border-b border-slate-200 bg-slate-100/70 px-4 py-12 sm:px-6">
		<div class="mx-auto max-w-6xl">
			<div class="mb-6">
				<h2 class="text-2xl font-bold tracking-tight text-slate-900">Example curriculum graph</h2>
				<p class="mt-1 text-sm text-slate-600">
					Prerequisite map across domains, subjects, and lectures in an undergraduate course.
				</p>
			</div>

			<!-- Graph Iframe Frame -->
			<div class="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md">
				<div
					class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600"
				>
					<div class="flex items-center gap-2">
						<span class="size-2 rounded-full bg-emerald-500"></span>
						<span class="font-medium text-slate-800">AM101 • Linear Algebra & Calculus</span>
					</div>
					<span class="text-slate-500">
						Interactive embed • Switch views or drag & zoom nodes
					</span>
				</div>

				<iframe
					src={resolve('/graph/example')}
					title="Example Curriculum Graph"
					class="h-130 w-full border-0 bg-white"
					loading="lazy"
				></iframe>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="border-b border-slate-200 bg-white px-4 py-16 sm:px-6">
		<div class="mx-auto max-w-6xl">
			<div class="max-w-2xl">
				<h2 class="text-2xl font-bold tracking-tight text-slate-900">Features</h2>
				<p class="mt-2 text-sm text-slate-600">
					Create prerequisite roadmaps, coordinate with colleagues, and publish shareable views.
				</p>
			</div>

			<div class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each features as feature (feature.title)}
					<div
						class="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 p-5 transition-colors hover:border-slate-300 hover:bg-slate-50"
					>
						<div
							class="flex size-10 items-center justify-center rounded-md bg-purple-100 text-purple-800"
						>
							<feature.icon class="size-5" />
						</div>
						<h3 class="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
						<p class="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Manual Spotlight Section -->
	<section class="border-b border-slate-200 bg-slate-50 px-4 py-12 sm:px-6">
		<div class="mx-auto max-w-6xl">
			<div
				class="flex flex-col items-start justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 md:flex-row md:items-center"
			>
				<div class="max-w-2xl">
					<h2 class="text-xl font-bold text-slate-900">Course-staff and TA manual</h2>
					<p class="mt-2 text-sm leading-relaxed text-slate-600">
						Read step-by-step walkthroughs for courses, graphs, domains, subjects, lectures, and
						shareable links.
					</p>
				</div>
				<Button
					variant="outline"
					size="default"
					href="https://prime-tu-delft.github.io/graaf/"
					target="_blank"
					rel="noreferrer"
					class="border-slate-300 text-slate-800 hover:bg-slate-50"
				>
					<BookOpen class="size-4" />
					<span>Open manual</span>
					<ExternalLink class="size-3.5 opacity-60" />
				</Button>
			</div>
		</div>
	</section>

	<!-- Contributors Section -->
	<section class="border-b border-slate-200 bg-white px-4 py-16 sm:px-6">
		<div class="mx-auto max-w-6xl">
			<div class="text-center">
				<h2 class="text-2xl font-bold tracking-tight text-slate-900">Contributors</h2>
			</div>

			<div class="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
				{#each contributors as contributor (contributor.name)}
					<div
						class="flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50/50 p-5 text-center transition-colors hover:border-slate-300"
					>
						<Avatar.Root class="size-16 border border-slate-200 shadow-xs">
							{#if contributor.image}
								<Avatar.Image
									src={contributor.image}
									alt={'Profile photo of ' + contributor.name}
									class="aspect-square object-cover"
								/>
							{/if}
							<Avatar.Fallback class="bg-purple-100 text-sm font-semibold text-purple-900">
								{contributor.initials}
							</Avatar.Fallback>
						</Avatar.Root>

						<h3 class="mt-3 text-sm font-semibold text-slate-900">{contributor.name}</h3>
						<p class="text-xs text-slate-500">{contributor.title}</p>

						{#if contributor.githubUrl}
							<!-- eslint-disable svelte/no-navigation-without-resolve -- gh url -->
							<a
								href={contributor.githubUrl}
								target="_blank"
								rel="noreferrer"
								class="mt-3 inline-flex items-center gap-1 text-xs text-slate-600 hover:text-purple-900"
							>
								{@render githubIcon('size-3.5')}
								<span>@{contributor.githubUsername}</span>
							</a>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Footer / License Section -->
	<footer class="bg-slate-900 py-10 text-slate-400">
		<div class="mx-auto max-w-6xl px-4 sm:px-6">
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
</div>
