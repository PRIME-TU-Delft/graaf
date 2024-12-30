<script lang="ts">
	import { enhance } from '$app/forms';
	import Trash2 from 'lucide-svelte/icons/trash-2';
	import { fly } from 'svelte/transition';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<nav class="border-b-2 border-blue-300 bg-blue-200 p-4">
	<a href="/">Home</a>
	<a href="/courses">Courses</a>
</nav>

<section class="prose mx-auto p-4 text-blue-900">
	{#if data.error != undefined}
		<h1>Oops! Something went wrong</h1>
		<p>{data.error}</p>
	{:else}
		<h1 class="shadow-blue-500/70">{data.course.code} - {data.course.name}</h1>
		<p>
			Here you can find all Programs and associated Courses. Click on any of them to edit or view
			more information. You can also create a sandbox environment to experiment with the Graph
			Editor. Can't find a specific Program or Course? Maybe you don't have access to it. Contact
			one of its Admins to get access.
		</p>

		{#each data.course.programs as program, i (program.id)}
			<div class="block" transition:fly={{ x: -300, duration: 400, delay: 200 * i }}>
				<li
					class="flex items-center justify-between rounded bg-blue-100 p-2 transition-colors hover:bg-blue-200 hover:shadow-lg"
				>
					<span>{program.name}</span>
					<form method="POST" action="?/remove-program-from-course" use:enhance>
						<input type="hidden" name="course-id" value={data.course.code} />
						<input type="hidden" name="program-id" value={program.id} />
						<button
							class="rounded-sm bg-blue-100 p-2 transition-colors hover:bg-blue-300"
							aria-label="Remove program from course"><Trash2 class="size-4" /></button
						>
					</form>
				</li>
			</div>
		{/each}
	{/if}
</section>
