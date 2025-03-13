<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import type { Course } from '@prisma/client';
	import { tick } from 'svelte';

	type Props = {
		courses: Course[];
	};

	const { courses }: Props = $props();

	let open = $state(false);
	let value = $state(''); // eslint-disable-line @typescript-eslint/no-unused-vars
	let triggerRef = $state<HTMLButtonElement>(null!);

	// MARK: - Enhance
	// We want to refocus the trigger button when the user selects
	// an item from the list so users can continue navigating the
	// rest of the form with the keyboard.
	function closeAndFocusTrigger() {
		open = false;
		tick().then(() => {
			triggerRef.focus();
		});
	}
</script>

<Popover.Root bind:open>
	<Command.Root class="bg-none">
		<form action="?/search-courses" method="POST" use:enhance>
			<Popover.Trigger>
				<Command.Input
					class="border-none"
					onclick={() => (open = true)}
					placeholder="Search course..."
				/>
			</Popover.Trigger>
		</form>

		<Popover.Content class="w-80 p-0">
			<Command.List>
				<Command.Empty>No course found.</Command.Empty>
				<Command.Group>
					{#each courses as course (course.code)}
						<Command.Item
							value={course.name}
							onSelect={() => {
								value = course.name;
								closeAndFocusTrigger();
							}}
						>
							{course.name}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Popover.Content>
	</Command.Root>
</Popover.Root>
