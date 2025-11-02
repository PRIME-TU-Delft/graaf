<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { Trash2 } from '@lucide/svelte';
	import type { Domain } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { deleteDomainRel } from './domain.remote';

	type Props = {
		sourceDomain: Domain;
		targetDomain: Domain;
		graph: PrismaGraphPayload;
	};

	let { graph, sourceDomain, targetDomain }: Props = $props();

	let popoverOpen = $state(false);
	let formRef = $state<HTMLFormElement>();
</script>

<Popover.Root bind:open={popoverOpen}>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
		<Trash2 />
	</Popover.Trigger>
	<Popover.Content side="right" class="space-y-1">
		<form
			{...deleteDomainRel.enhance(async ({ form, submit }) => {
				try {
					await submit().updates(getGraph(graph.id));
					if (deleteDomainRel.fields.allIssues()?.length) return;

					form.reset();
					popoverOpen = false;
					toast.success('Domain relationship successfully deleted!');
				} catch (e) {
					toast.error(JSON.stringify(e));
				}
			})}
			bind:this={formRef}
		>
			<input hidden {...deleteDomainRel.fields.graphId.as('number')} value={graph.id} />
			<input
				hidden
				{...deleteDomainRel.fields.sourceDomainId.as('number')}
				value={sourceDomain.id}
			/>
			<input
				hidden
				{...deleteDomainRel.fields.targetDomainId.as('number')}
				value={targetDomain.id}
			/>

			<p class="mb-2">Are you sure you would like to delete this domain relationship?</p>
			<Field.Submit
				form={deleteDomainRel}
				oncancel={() => {
					popoverOpen = false;
					formRef?.reset();
				}}
				submitTitle="Yes, delete"
				loadingTitle="Deleting relationship..."
			/>
		</form>
	</Popover.Content>
</Popover.Root>
