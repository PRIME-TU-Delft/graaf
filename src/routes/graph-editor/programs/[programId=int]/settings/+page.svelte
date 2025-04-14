<script lang="ts">
	import { enhance } from '$app/forms';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import type { PageData } from './$types';
	import { columns } from './courses/course-columns';
	import CoursesDataTable from './courses/CoursesDataTable.svelte';
	import EditProgramName from './EditProgramName.svelte';
	import ProgramAdmins from './superUsers/ProgramAdmins.svelte';

	let { data }: { data: PageData } = $props();

	let editProgramDialogOpen = $state(false);
</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-blue-50/80 p-4 shadow-none shadow-blue-200/70 backdrop-blur sm:sticky sm:border sm:border-blue-200 sm:shadow-lg"
>
	<h1 class="m-0">{data.program.name}</h1>

	{#if hasProgramPermissions(data.user, data.program, 'ProgramAdmin')}
		<DialogButton
			bind:open={editProgramDialogOpen}
			button="Edit program name"
			icon="edit"
			title="Edit the name of the program"
		>
			<EditProgramName
				program={data.program}
				editProgramForm={data.editProgramForm}
				onSuccess={() => {
					editProgramDialogOpen = false;
				}}
			/>
		</DialogButton>
	{/if}
</section>

<section class="prose mx-auto p-4">
	<p>
		Manage program settings with program name: <span class="font-mono">{data.program.name}</span>.
	</p>
</section>

<ProgramAdmins program={data.program} user={data.user} />

<section class="container prose mx-auto p-4">
	<CoursesDataTable
		data={data.program?.courses}
		program={data.program}
		{columns}
		courses={data.allCourses}
	/>
</section>

<!-- Only a super admin is able to delete a program -->
{#if hasProgramPermissions(data.user, data.program, 'OnlySuperAdmin')}
	<section
		class="prose mx-auto my-12 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
	>
		<h2 class="text-red-950">Danger zone</h2>
		<div class="flex items-center gap-2">
			<p>Delete program:</p>

			<AlertDialog.Root>
				<AlertDialog.Trigger class={'ml-auto ' + buttonVariants({ variant: 'destructive' })}>
					Delete
				</AlertDialog.Trigger>
				<AlertDialog.Content>
					<AlertDialog.Header>
						<AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
						<AlertDialog.Description>
							This action cannot be undone. This will permanently delete this program and remove the
							data from our servers. It is also possible to archive this program.
						</AlertDialog.Description>
					</AlertDialog.Header>
					<AlertDialog.Footer>
						<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
						<form action="?/delete-program" method="POST" use:enhance>
							<input type="text" name="programId" value={data.program.id} hidden />
							<AlertDialog.Action type="submit">Delete anyway</AlertDialog.Action>
						</form>
					</AlertDialog.Footer>
				</AlertDialog.Content>
			</AlertDialog.Root>
		</div>
	</section>
{/if}
