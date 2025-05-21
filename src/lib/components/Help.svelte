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
	class="fixed top-2 right-4 z-20 gap-1 bg-transparent text-white hover:underline"
>
	{@render children()}
</DialogButton>
