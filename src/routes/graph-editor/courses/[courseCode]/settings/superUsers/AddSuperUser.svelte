<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';

	import { page } from '$app/state';
	import SelectUsers from '$lib/components/SelectUsers.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { editSuperUserSchema } from '$lib/zod/courseSchema';
	import type { Course, Program, User } from '@prisma/client';
	import { useId } from 'bits-ui';
	import Undo_2 from 'lucide-svelte/icons/undo-2';
	import { toast } from 'svelte-sonner';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import type { PageData } from '../$types';

	type AddNewUserProps = {
		course: Course & {
			admins: User[];
			editors: User[];
			programs: (Program & { admins: User[]; editors: User[] })[];
		};
		onSuccess?: () => void;
	};

	let { course, onSuccess = () => {} }: AddNewUserProps = $props();

	const form = superForm((page.data as PageData).editSuperUserForm, {
		id: 'add-user-to-course-form-' + useId(),
		validators: zodClient(editSuperUserSchema),
		onResult: ({ result }) => {
			if (result.type == 'success') {
				toast.success('Successfully add user!');
				onSuccess();
			}
		}
	});

	const { form: formData, enhance, submitting, delayed } = form;

	const programUserRoles = $derived.by(() => {
		const userRoles = new Map<string, string>();

		course.programs.forEach((program) => {
			program.editors.forEach((editor) => {
				userRoles.set(editor.id, 'editor');
			});
			program.admins.forEach((admin) => {
				userRoles.set(admin.id, 'admin');
			});
		});

		return userRoles;
	});

	const nonSuperUser = $derived.by(() => {
		const allUsers = (page.data as PageData).allUsers;

		// filter out all users that are already a super user in this program
		return allUsers.filter(
			(user) =>
				!course.admins.some((u) => u.id == user.id) && !course.editors.some((u) => u.id == user.id)
		);
	});

	let isAdmin = $state(false);

	const userRole = $derived(isAdmin ? 'admin' : 'editor');

	$effect(() => {
		$formData.courseId = course.id;
	});
</script>

<form action="?/edit-super-user" method="POST" use:enhance>
	<input type="hidden" name="courseId" value={course.id} />

	<Form.Field {form} name="userId">
		<SelectUsers
			users={nonSuperUser}
			userRoles={programUserRoles}
			onSelect={(user) => {
				$formData.userId = user.id;
			}}
		/>
	</Form.Field>

	<input type="hidden" name="role" value={userRole} />

	<div class="flex items-center space-x-2 p-2">
		<Checkbox id="is-admin" bind:checked={isAdmin} />
		<Label for="is-admin" class="text-sm font-medium leading-none">
			User is allowed admin permissions
		</Label>
	</div>

	<div class="mt-2 flex items-center justify-between gap-1">
		<Form.FormError class="w-full text-right" {form} />

		<Button
			variant="outline"
			disabled={!$formData.userId || !isAdmin || $submitting}
			onclick={() => {
				isAdmin = false;
				form.reset({ newState: { userId: '', role: 'editor' } });
			}}
		>
			<Undo_2 /> Reset
		</Button>
		<Form.FormButton disabled={$submitting} loading={$delayed}>
			Add super user
			{#snippet loadingMessage()}
				<span>Adding user...</span>
			{/snippet}
		</Form.FormButton>
	</div>
</form>
