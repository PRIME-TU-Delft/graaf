<script lang="ts">
	import { enhance } from '$app/forms';

	// Components
	import { buttonVariants } from '$lib/components/ui/button';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Input } from '$lib/components/ui/input/index.js';

	// Icons
	import { Trash2 } from '@lucide/svelte';

	// Types
	import type { Course } from '@prisma/client';

	type Props = { course: Course };
	let { course }: Props = $props();

	let confirmName = $state('');
	const nameMatches = $derived(confirmName === course.name);
</script>

<AlertDialog.Root onOpenChange={(open) => !open && (confirmName = '')}>
	<AlertDialog.Trigger class={buttonVariants({ variant: 'destructive' })}>
		<Trash2 /> Delete Course
	</AlertDialog.Trigger>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete this course, its graphs and
				links. Embeds for this course will stop working. Type <b>{course.name}</b> to confirm.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<Input bind:value={confirmName} placeholder={course.name} autocomplete="off" />
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<form action="?/delete-course" method="POST" use:enhance>
				<input type="hidden" name="courseId" value={course.id} />
				<AlertDialog.Action
					type="submit"
					disabled={!nameMatches}
					class={buttonVariants({ variant: 'destructive' })}
				>
					Delete anyway
				</AlertDialog.Action>
			</form>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
