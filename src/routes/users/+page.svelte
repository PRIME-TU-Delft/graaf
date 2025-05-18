<script lang="ts">
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto mt-12 p-4 text-purple-900">
	<h1>All Users</h1>
	<p>Here you can find all users</p>

	<div class="grid gap-2">
		{#each data.users.toSorted((a) => (a.id == data.user.id ? -1 : 0)) as user, i (user.id)}
			<div
				class={cn(
					'flex items-center justify-between rounded bg-purple-50 p-2 shadow-none shadow-purple-300 transition-all hover:bg-purple-100 hover:shadow-sm',
					user.id == data.user.id ? 'bg-purple-200' : ''
				)}
				transition:fly={{ x: -300, duration: 400, delay: 200 * i }}
			>
				<span>{i + 1}. {user.nickname}</span>
				<div class="flex items-center gap-2">
					<span>{user.firstName} {user.lastName}</span>
				</div>
			</div>
		{/each}
	</div>
</section>
