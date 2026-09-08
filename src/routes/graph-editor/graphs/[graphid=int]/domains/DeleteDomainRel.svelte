<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Trash2 } from '@lucide/svelte';
	import type { Domain, Graph } from '@prisma/client';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import { type PageData } from './$types';
	import { toast } from 'svelte-sonner';
	import { domainRelSchema } from '$lib/zod/domainSchema';

	type Props = {
		sourceDomain: Domain;
		targetDomain: Domain;
		graph: Graph;
	};

	let { graph, sourceDomain, targetDomain }: Props = $props();

	const id = $props.id();

	const form = superForm((page.data as PageData).newDomainRelForm, {
		id: id,
		validators: zodClient(domainRelSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Domain relationship deleted successfully!');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	$effect(() => {
		if (sourceDomain && targetDomain) {
			$formData.sourceDomainId = sourceDomain.id;
			$formData.targetDomainId = targetDomain.id;
			$formData.graphId = graph.id;
		}
	});
</script>

<Popover.Root>
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Popover.Trigger {...props} class={cn(buttonVariants({ variant: 'destructive' }))}>
						<Trash2 />
					</Popover.Trigger>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content><p>Delete relationship</p></Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
	<Popover.Content side="right" class="space-y-1">
		<form action="?/delete-domain-rel" method="POST" use:enhance>
			<input type="hidden" name="graphId" value={graph.id} />
			<input type="hidden" name="sourceDomainId" value={sourceDomain.id} />
			<input type="hidden" name="targetDomainId" value={targetDomain.id} />

			<p class="mb-2">Are you sure you would like to delete this domain relationship?</p>
			<Form.FormButton
				variant="destructive"
				disabled={$submitting}
				loading={$delayed}
				loadingMessage="Delete relationship..."
			>
				Yes, delete
			</Form.FormButton>
		</form>
	</Popover.Content>
</Popover.Root>
