<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<nav class="border-b-2 border-blue-300 bg-blue-200 p-4">
	<a href="/">Home</a>
</nav>

<section class="prose mx-auto p-4 text-blue-900">
	<h1 class="shadow-blue-500/70">Courses</h1>
	<p>Here you can find all courses</p>

	<div class="grid gap-2">
		{#each data.courses as course, i (course.code)}
			<div
				class="flex items-center justify-between rounded bg-blue-100 p-2 transition-colors hover:bg-blue-200 hover:shadow-lg"
				transition:fly={{ x: -300, duration: 400, delay: 200 * i }}
			>
				<span>{course.name}</span>
				<div class="flex items-center gap-2">
					<span>{course.code}</span>

					<Button href="/courses/{course.code}" variant="secondary">
						View <ArrowRight />
					</Button>
				</div>
			</div>
		{/each}
	</div>
</section>
