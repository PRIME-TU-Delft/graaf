<script lang="ts">
	import { page } from '$app/state';
	import { useId } from 'bits-ui';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { editSuperUserSchema } from '$lib/zod/sandboxSchema';

	// Components
	import * as Form from '$lib/components/ui/form/index.js';
	
	// Icons
	import { Trash2 } from '@lucide/svelte';

	// Types
	import type { User, Sandbox } from '@prisma/client';
	import type { PageData } from '../$types';

	type DeleteSandboxProps = {
        user: User;
		sandbox: Sandbox;
		onSuccess?: () => void;
	};

	let { user, sandbox, onSuccess = () => {} }: DeleteSandboxProps = $props();

	const data = page.data as PageData;
	const form = superForm(data.editSuperUserForm, {
		id: 'edit-super-user-' + useId(),
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully removed editor!');
				onSuccess();
			}
		}
	});

	const { enhance, submitting, delayed } = form;
</script>

<form action="?/edit-super-user" method="POST" use:enhance>
	<input type="hidden" name="sandboxId" value={sandbox.id} />
    <input type="hidden" name="userId" value={user.id} />
    <input type="hidden" name="role" value="revoke" />

	<Form.FormButton
		variant="destructive"
		disabled={$submitting}
		loading={$delayed}
		loadingMessage="Removing..."
	>
		<Trash2 /> Revoke
	</Form.FormButton>
</form>
