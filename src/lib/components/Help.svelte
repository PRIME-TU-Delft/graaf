<script lang="ts">
	import type { Snippet } from 'svelte';
	import DialogButton from './DialogButton.svelte';

	type Props = {
		title: string;
		children: Snippet<[]>;
	};

	const { title, children }: Props = $props();
</script>

<DialogButton
	{title}
	button="Help"
	icon="help"
	class="fixed right-16 top-2 z-20 gap-1 bg-transparent text-white hover:underline"
>
	{@render children()}
</DialogButton>
