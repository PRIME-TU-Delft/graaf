<script lang="ts">
	import { Accordion as AccordionPrimitive } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		level = 3,
		open = false,
		children,
		...restProps
	}: WithoutChild<AccordionPrimitive.TriggerProps> & {
		level?: AccordionPrimitive.HeaderProps['level'];
		open?: boolean;
	} = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		data-slot="accordion-trigger"
		bind:ref
		class={cn(
			'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-center justify-between gap-2 rounded-md px-2 py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
			className
		)}
		{...restProps}
	>
		{@render children?.()}

		<ChevronDownIcon
			class="text-primary pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
		/>

		<p class="text-primary">
			{#if open}
				Hide
			{:else}
				Show
			{/if}
		</p>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
