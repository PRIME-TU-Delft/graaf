<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { User } from '@prisma/client';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import TestUser from './TestUser.svelte';

	const { data }: { data: PageData } = $props();

	let testUsers: User[] = $state([]);

	onMount(() => {
		// If in netlify environment, fetch all test users
		if (data.isInNetlify) {
			fetch('./auth/get-all-testusers')
				.then((res) => res.json())
				.then((data) => {
					testUsers = data;
				});
		}
	});

	let contributors = [
		{ name: 'Abel de Bruijn', title: 'Developer' },
		{ name: 'Bram Kreulen', title: 'Developer' },
		{ name: 'Julia van der Kris', title: 'Migration and Devops expert' }
	];
</script>

<section class="prose prose-lg mx-auto mt-24">
	<h2>What is the course graph?</h2>
	Welcome to the graph editor, here you can assemble your own course graph! Sign-in to get started. The
	graph is produced by
	<a
		href="https://www.tudelft.nl/ewi/over-de-faculteit/afdelingen/applied-mathematics/studeren/prime"
	>
		PRIME
	</a>
	(PRogramme for Inovation in Math Education) and is a tool for teachers to create and share course graphs.

	<p>Sign-in with your TU Delft account to get started!</p>

	{#if data.isInNetlify}
		<div class="space-y-2 p-2">
			{#each testUsers as user (user.id)}
				<TestUser {user} />
			{/each}
		</div>
	{/if}

	<form action="?/auth" method="POST">
		<Button type="submit">Sign-in</Button>
	</form>
</section>

<section class="prose mx-auto mt-12">
	<h2>Contributors</h2>
	{#each contributors as { name, title } (name)}
		<div class="mb-2 flex gap-2">
			<div class="not-prose w-24 overflow-hidden rounded">
				<img
					class="aspect-square object-cover"
					src={'/contributors/' + name.toLowerCase().replaceAll(' ', '-') + '.jpg'}
					alt={'Profile of ' + name}
				/>
			</div>
			<div class="flex flex-col gap-1">
				<span class="bold">{name}</span>
				<span class="text-xs">{title}</span>
			</div>
		</div>
	{/each}
</section>

<section class="prose mx-auto mt-12">
	<h2>Licence</h2>
	<p>
		<a class="not-prose" rel="license" href="http://creativecommons.org/licenses/by/4.0/"
			><img
				alt="Creative Commons License"
				style="border-width:0"
				src="https://i.creativecommons.org/l/by/4.0/88x31.png"
			/></a
		><br /><span>PRIME Graph</span>
		by
		<a
			href="https://www.tudelft.nl/ewi/over-de-faculteit/afdelingen/applied-mathematics/studeren/prime"
			property="cc:attributionName"
			rel="cc:attributionURL">PRIME, TU Delft</a
		>
		is licensed under a
		<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"
			>Creative Commons Attribution 4.0 International License</a
		>.<br />Based on a work at
		<a href="https://github.com/PRIME-TU-Delft/graaf" rel="dct:source"
			>https://github.com/PRIME-TU-Delft/graaf</a
		>.<br />Permissions beyond the scope of this license may be available at
		<a href="https://github.com/PRIME-TU-Delft/graaf/blob/main/LICENSE" rel="cc:morePermissions"
			>https://github.com/PRIME-TU-Delft/graaf/blob/main/LICENSE</a
		>.
	</p>
</section>
