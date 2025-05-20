<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import Search from 'lucide-svelte/icons/search';
	import { cn } from '$lib/utils.js';

	type CommandInputProps = {
		hasBorder?: boolean;
		onfocus?: () => void;
		onfocusout?: () => void;
	};

	let {
		ref = $bindable(null),
		class: className,
		value = $bindable(''),
		hasBorder = true,
		onfocusout = () => {},
		...restProps
	}: CommandPrimitive.InputProps & CommandInputProps = $props();
</script>

<div
	class={cn(['flex items-center  px-2', { 'border-b': hasBorder }])}
	data-command-input-wrapper=""
>
	<Search {onfocus} {onfocusout} class="mr-2 size-4 shrink-0 opacity-50" />
	<CommandPrimitive.Input
		class={cn(
			'placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			'placeholder:text-muted-foreground flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			className
		)}
		bind:ref
		{...restProps}
		bind:value
	/>
</div>
