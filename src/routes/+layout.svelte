<script lang="ts">
	import '../app.css';
	import '$styles/global.sass';
	interface Props {
		children?: import('svelte').Snippet;
	}

	let { children }: Props = $props();
</script>

{@render children?.()}
