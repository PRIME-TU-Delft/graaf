<script lang="ts">
	import { page } from '$app/state';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { changePinSchema } from '$lib/zod/courseSchema';
	import type { Course, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Pin from '@lucide/svelte/icons/pin';
	import Unpin from '@lucide/svelte/icons/pin-off';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client as zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from './$types';
	import { Loader } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type Props = {
		user: User;
		course: Course & { pinnedBy: Pick<User, 'id'>[] };
	};

	const { user, course }: Props = $props();

	const form = superForm((page.data as PageData).coursePinnedForm, {
		id: 'change-lecture-form-' + useId(),
		validators: zodClient(changePinSchema),
		onResult: ({ result }) => {
			if (result.type !== 'success') {
				toast.error('Error changing pin status');
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const pinned = $derived(course.pinnedBy.some((u) => u.id == user.id));
	$effect(() => {
		$formData.courseId = course.id;
		$formData.pin = pinned;
	});
</script>

<form action="?/change-course-pin" method="POST" use:enhance>
	<input type="text" name="courseId" value={course.id} hidden />
	<input type="text" name="pin" value={!pinned} hidden />

	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Form.FormButton
						{...props}
						variant={pinned ? 'default' : 'outline'}
						disabled={$submitting}
						loading={$delayed}
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							(e.currentTarget as HTMLButtonElement).form?.requestSubmit();
						}}
						onsubmit={(e) => {
							e.stopPropagation();
						}}
					>
						{#if !pinned}
							<Pin class="text-gray-600" />
						{:else}
							<Unpin class="text-white" />
						{/if}

						{#snippet loadingMessage()}
							<Loader class={cn('animate-spin', pinned ? 'text-gray-300' : 'text-gray-600')} />
						{/snippet}
					</Form.FormButton>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content><p>{pinned ? 'Unpin course' : 'Pin course'}</p></Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</form>
