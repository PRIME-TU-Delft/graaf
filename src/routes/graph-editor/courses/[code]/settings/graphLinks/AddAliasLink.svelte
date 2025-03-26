<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { Course, Graph, Link } from '@prisma/client';

	type AddAliasLinkProps = {
		course: Course & {
			links: Link[];
		};
		graph: Graph;
	};

	let { course, graph }: AddAliasLinkProps = $props();

	let newAlias = $state('');
	let loading = $state(false);
	let error = $state('');

	async function handleAddAlias() {
		// await
	}

	$effect(() => {
		if (loading) error = '';

		if (course.links.map((l) => l.name).includes(newAlias)) {
			error = 'Alias already exists';
		}
	});
</script>

{#if error}
	<div class="text-sm text-red-500">{error}</div>
{/if}

<div class="flex items-center gap-2">
	<Input type="text" name="alias" placeholder="Add an alias" bind:value={newAlias} />

	<Button onclick={handleAddAlias} disabled={newAlias.length < 1 || loading}>
		{#if loading}
			Adding link...
		{:else}
			Add link
		{/if}
	</Button>
</div>
