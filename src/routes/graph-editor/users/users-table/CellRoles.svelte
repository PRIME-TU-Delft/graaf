<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { cn } from '$lib/utils';
	import { displayName } from '$lib/utils/displayUserName';
	import type { DataUser } from './userTableColumns';

	type Props = {
		user: DataUser;
	};

	const { user }: Props = $props();

	const roleLength = $derived(
		(user.role === 'ADMIN' ? 1 : 0) +
			user.course_editors.length +
			user.course_admins.length +
			user.program_editors.length +
			user.program_admins.length
	);
</script>

<Dialog.Root>
	<Dialog.Trigger class={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
		{roleLength == 0 ? 'No' : roleLength} Role{roleLength !== 1 ? 's' : ''}
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{displayName(user)}'s privilages</Dialog.Title>
			<Dialog.Description>
				Here you can promote/demote a user from admin or editor privilages
			</Dialog.Description>
		</Dialog.Header>
	</Dialog.Content>
</Dialog.Root>
