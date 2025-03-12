<script lang="ts">
	import type { ComponentProps } from 'svelte';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';

	let {
		checked = false,
		onCheckedChange = (v) => (checked = v),
		onclick,
		...restProps
	}: ComponentProps<typeof Checkbox> = $props();
</script>

<Checkbox
	bind:checked={() => checked, onCheckedChange}
	onclick={(e) => {
		e.stopPropagation();
		onclick?.(e);
	}}
	{...restProps}
/>
