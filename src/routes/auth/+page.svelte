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

	<p>Sign-in to get started!</p>

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

<section class="prose mx-auto mt-2">
	<h2>Credits</h2>
</section>

<section class="prose mx-auto mt-2">
	<h2>Licence</h2>
</section>
