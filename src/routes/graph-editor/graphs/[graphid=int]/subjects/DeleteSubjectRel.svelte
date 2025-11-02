<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils';
	import type { PrismaGraphPayload } from '$lib/validators/types';
	import { Trash2 } from '@lucide/svelte';
	import type { Subject } from '@prisma/client';
	import { toast } from 'svelte-sonner';
	import { getGraph } from '../../graph.remote';
	import { deleteSubjectRel } from './subjects.remote';

	type Props = {
		sourceSubject: Subject;
		targetSubject: Subject;
		graph: PrismaGraphPayload;
	};

	let { graph, sourceSubject, targetSubject }: Props = $props();

	let popoverOpen = $state(false);
	let formRef = $state<HTMLFormElement>();
</script>

<Popover.Root bind:open={popoverOpen}>
	<Popover.Trigger class={cn(buttonVariants({ variant: 'destructive' }))}>
		<Trash2 />
	</Popover.Trigger>
	<Popover.Content side="right" class="space-y-1">
		<form
			{...deleteSubjectRel.enhance(async ({ form, submit }) => {
				try {
					await submit().updates(getGraph(graph.id));
					if (deleteSubjectRel.fields.allIssues()?.length) return;

					form.reset();
					popoverOpen = false;
					toast.success('Subject relationship successfully deleted!');
				} catch (e) {
					toast.error(JSON.stringify(e));
				}
			})}
			bind:this={formRef}
		>
			<input hidden {...deleteSubjectRel.fields.graphId.as('number')} value={graph.id} />
			<input
				hidden
				{...deleteSubjectRel.fields.sourceSubjectId.as('number')}
				value={sourceSubject.id}
			/>
			<input
				hidden
				{...deleteSubjectRel.fields.targetSubjectId.as('number')}
				value={targetSubject.id}
			/>

			<p class="mb-2">Are you sure you would like to delete this subject relationship?</p>
			<Field.Submit
				form={deleteSubjectRel}
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
