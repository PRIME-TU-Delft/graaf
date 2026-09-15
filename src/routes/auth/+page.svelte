<script lang="ts">
	import { resolve } from '$app/paths';
	import AuthButton from '$lib/components/AuthButton.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Logo from '$lib/components/Logo.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ArrowLeft, ExternalLink, LogIn } from '@lucide/svelte';
	import type { User } from '@prisma/client';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import TestUser from './TestUser.svelte';

	const { data }: { data: PageData } = $props();

	let testUsers: User[] = $state([]);
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

	onMount(() => {
		// If in deploy preview environment, fetch all test users
		if (data.isInNetlify) {
			fetch('./auth/get-all-testusers')
				.then((res) => res.json())
				.then((userData) => {
					testUsers = userData;
				});
		}
	});
</script>

<svelte:head>
	<title>Sign in | PRIME Graph Editor</title>
</svelte:head>

<div
	class="flex min-h-screen flex-col justify-between bg-slate-50 text-slate-900 selection:bg-purple-500 selection:text-white"
>
	<!-- Top Bar -->
	<TopBar>
		<Button variant="purple" href={resolve('/')}>
			<ArrowLeft class="size-4" />
			<span>Back to home</span>
		</Button>
	</TopBar>

	<!-- Main Sign-in Card Section -->
	<main class="grain relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
		<div class="w-full max-w-md">
			<div class="overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="mx-auto mb-6 flex size-16 cursor-pointer items-center justify-center rounded-2xl bg-purple-950 p-2.5 shadow-md transition-transform duration-200 hover:scale-105"
					onmouseenter={handleLogoInteraction}
				>
					<Logo mouseState={logoMouseState} class="size-10" />
				</div>

				<div class="text-center">
					<h1 class="text-2xl font-bold tracking-tight text-slate-900">Sign in to Graph Editor</h1>
					<p class="mt-2 text-sm leading-relaxed text-slate-600">
						Log in with your TU Delft credentials to create and manage course graphs.
					</p>
				</div>

				<div class="mt-8 space-y-4">
					<AuthButton class="w-full bg-purple-600 font-medium text-white hover:bg-purple-500">
						{#snippet signedOut()}
							<LogIn class="size-5" />
							<span>Sign in with TU Delft NetID</span>
						{/snippet}
					</AuthButton>

					<div
						class="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-center text-xs text-slate-600"
					>
						<p>
							Need guidance? Read the
							<a
								href="https://prime-tu-delft.github.io/graaf/"
								target="_blank"
								rel="noreferrer"
								class="font-medium text-purple-800 underline hover:text-purple-950"
							>
								course-staff and TA manual
								<ExternalLink class="inline-block size-3" />
							</a>
						</p>
					</div>
				</div>

				<!-- Deploy Preview Test Users -->
				{#if data.isInNetlify}
					<div class="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
						<div class="flex items-center justify-between border-b border-slate-200 pb-2">
							<h2 class="text-xs font-semibold tracking-wider text-slate-700 uppercase">
								Test accounts
							</h2>
							<span
								class="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-900"
							>
								Deploy preview
							</span>
						</div>
						<div class="mt-3 space-y-2">
							{#each testUsers as user (user.id)}
								<TestUser {user} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</main>

	<Footer />
</div>
