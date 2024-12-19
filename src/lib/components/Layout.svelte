<script lang="ts">
	interface Props {
		title: string;
		header?: import('svelte').Snippet;
		toolbar?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let { title, header, toolbar, children }: Props = $props();
</script>

<main class="mx-auto flex max-w-4xl flex-col gap-4 p-4">
	<section class="mx-auto my-4 max-w-2xl">
		<h2 class="text-2xl font-bold">{title}</h2>
		{#if header}
			{@render header()}
		{/if}
	</section>

	{#if toolbar}
		<section class="flex items-center gap-2">
			{@render toolbar?.()}
		</section>
	{/if}

	<section class="grid grid-cols-1 gap-2">
		{@render children?.()}
	</section>
</main>
