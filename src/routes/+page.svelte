<script lang="ts">
	import { resolve } from '$app/paths';
	import Footer from '$lib/components/Footer.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		ArrowRight,
		BookOpen,
		ExternalLink,
		FlaskRound,
		Layers,
		Link,
		LogIn,
		Network,
		Share2
	} from '@lucide/svelte';
	import type { PageData } from './$types';

	const { data }: { data: PageData } = $props();

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

<div class="min-h-screen bg-white text-slate-900 selection:bg-purple-500 selection:text-white">
	<!-- Top Navigation Bar -->
	<TopBar>
		<a
			href="https://prime-tu-delft.github.io/graaf/"
			target="_blank"
			rel="noreferrer"
			class="hidden items-center gap-1.5 rounded-md px-1 py-1.5 text-sm transition-colors hover:underline sm:flex"
		>
			<span>Manual</span>
		</a>
		<a
			href="https://github.com/PRIME-TU-Delft/graaf"
			target="_blank"
			rel="noreferrer"
			class="flex items-center gap-1.5 rounded-md px-1 py-1.5 text-sm transition-colors hover:underline sm:flex"
			aria-label="GitHub Repository"
		>
			<span class="hidden sm:inline">GitHub</span>
		</a>

		{#if data.user}
			<Button
				variant="secondary"
				size="sm"
				href={resolve('/graph-editor')}
				class="border border-purple-800 bg-purple-200 font-medium text-purple-800 hover:bg-purple-100 hover:underline"
			>
				<span class="sm:hidden">Open</span>
				<span class="hidden sm:inline">Open Graph Editor</span>
				<ArrowRight class="size-4" />
			</Button>
		{:else}
			<form action="?/auth" method="POST">
				<input type="hidden" name="providerId" value="surfconext" />
				<Button
					type="submit"
					size="sm"
					class="border border-purple-800 bg-purple-200 font-medium text-purple-800 hover:bg-purple-100 hover:underline"
				>
					<LogIn class="size-4" />
					<span>Sign in</span>
				</Button>
			</form>
		{/if}
	</TopBar>

	<section
		class="flex flex-col divide-y divide-purple-900/60 border-b border-purple-900/60 md:flex-row md:divide-x md:divide-y-0"
	>
		<!-- Interactive Example Graph Section -->
		<div class="bg-slate-50 md:w-8/12">
			<div class="mx-auto my-4 px-4 sm:px-6 md:pr-2 md:pl-12">
				<div class="mb-4 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
					<h2 class="text-lg font-medium text-black">Example Curriculum Graph</h2>
					<span class="text-sm font-light text-slate-700">(Student's view)</span>
				</div>

				<!-- Graph Iframe Frame -->
				<div class="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-md">
					<div
						class="flex flex-col items-start gap-1 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:gap-2"
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
						class="h-80 w-full border-0 bg-white sm:h-96 md:h-130"
						loading="lazy"
					></iframe>
				</div>
			</div>
		</div>

		<div class="flex flex-col md:w-4/12">
			<div class="my-8 flex flex-1 flex-col justify-between px-4 sm:px-6 md:mr-12 md:px-8">
				<div class="flex flex-col">
					<h1 class="text-2xl font-bold tracking-tight">
						A tool for mapping course material as a graph
					</h1>
					<p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
						Course material rarely fits a single linear syllabus. Topics depend on each other, get
						reused across courses, and get taught in a different order every year. The Graph Editor
						lets course staff model that structure explicitly: <span
							class="font-semibold text-purple-800">domains</span
						>
						connect to show prerequisites,
						<span class="font-semibold text-purple-800">subjects</span> live inside a domain,
						<span class="font-semibold text-purple-800">lectures</span> group subjects into what's taught
						in a session.
					</p>
					<p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
						An example graph is shown nearby. You can drag nodes, zoom in and out, and change to
						different views.
					</p>
				</div>

				<hr class="my-3 w-full border-slate-300" />

				<div class="flex flex-col items-center justify-center gap-3">
					{#if data.user}
						<Button
							size="lg"
							href={resolve('/graph-editor')}
							class="w-full bg-purple-800 font-medium text-white hover:bg-purple-700"
						>
							<span>Open Graph Editor</span>
							<ArrowRight class="size-4" />
						</Button>
					{:else}
						<form action="?/auth" method="POST" class="w-full">
							<input type="hidden" name="providerId" value="surfconext" />
							<Button
								type="submit"
								size="lg"
								class="w-full bg-purple-800 font-medium text-white hover:bg-purple-700"
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
						class="hover:text-purple w-full border-purple-700 bg-slate-50 text-purple-800 hover:underline"
					>
						<BookOpen class="size-4" />
						<span>Read manual</span>
						<ExternalLink class="size-3.5 opacity-60" />
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="border-b border-slate-200 bg-white py-16">
		<div class="px-4 sm:px-6 md:px-12">
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
	<section class="border-b border-slate-200 bg-purple-50">
		<div
			class="flex flex-col divide-y divide-slate-200 px-4 sm:px-6 md:mx-12 md:flex-row md:divide-x md:divide-y-0 md:px-0"
		>
			<div class="md:w-1/2">
				<div
					class="flex flex-col items-start gap-3 py-8 sm:flex-row sm:items-center sm:gap-2 md:mr-6 md:py-12"
				>
					<div>
						<h2 class="text-xl font-bold text-purple-900">Sharing graphs with students</h2>
						<p class="mt-2 text-sm leading-relaxed text-slate-600">
							A finished graph can be shared as a read-only link, or embedded as an iframe anywhere.
							Viewers don't get edit access and don't need to log in.
						</p>
					</div>
					<Button
						variant="outline"
						size="default"
						href={resolve('/graph/example')}
						target="_blank"
						rel="noreferrer"
						class="border-slate-300 text-slate-800 hover:bg-slate-50"
					>
						<Link class="size-4" />
						<span>Open the link</span>
						<ExternalLink class="size-3.5 opacity-60" />
					</Button>
				</div>
			</div>
			<div class="md:w-1/2">
				<div
					class="flex flex-col items-start gap-3 py-8 sm:flex-row sm:items-center sm:gap-2 md:ml-6 md:py-12"
				>
					<div>
						<h2 class="text-xl font-bold text-purple-900">Course-staff and TA manual</h2>
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
		</div>
	</section>

	<!-- Contributors Section -->
	<section class="border-b border-slate-200 bg-white py-12">
		<div class="px-4 sm:px-6 md:px-12">
			<div class="text-start">
				<h2 class="text-2xl font-bold tracking-tight text-slate-900">Contributors</h2>
			</div>

			<div class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
				{#each contributors as contributor (contributor.name)}
					<div
						class="flex flex-row items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2 text-start transition-colors hover:border-slate-300"
					>
						<div class="flex flex-row items-center gap-4">
							<Avatar.Root class="size-12 border border-slate-200 shadow-xs">
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
							<div>
								<h3 class="text-sm font-semibold text-slate-900">{contributor.name}</h3>
								<p class="text-xs text-slate-500">{contributor.title}</p>
							</div>
						</div>

						{#if contributor.githubUrl}
							<!-- eslint-disable svelte/no-navigation-without-resolve -- gh url -->
							<a
								href={contributor.githubUrl}
								target="_blank"
								rel="noreferrer"
								class="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-purple-900"
							>
								<span class="font-mono">@{contributor.githubUsername}</span>
							</a>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<Footer />
</div>
