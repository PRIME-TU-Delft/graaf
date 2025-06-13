<script lang="ts">
	import { hasProgramPermissions } from '$lib/utils/permissions';
	import { columns } from './courses/course-columns';

	import DialogButton from '$lib/components/DialogButton.svelte';
	import SuperUserTable from './superUsers/SuperUserTable.svelte';
	import CoursesTable from './courses/CoursesTable.svelte';
	import EditProgramName from './EditProgramName.svelte';
	import DeleteProgram from './DeleteProgram.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editProgramDialogOpen = $state(false);
</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-purple-50/80 p-4 shadow-none shadow-purple-200/70 backdrop-blur sm:sticky sm:border sm:border-purple-200 sm:shadow-lg"
>
	<h1 class="!m-0">{data.program.name}</h1>

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
	<h2>Super Users</h2>
	<p>
		Super Users are the admins and editors of a programme. Programme super users automatically
		become admins of any course part of this programme.
	</p>
	<ul class="text-sm">
		<li>
			<b>Programme Admins</b><br />
			Programme Admins are able to manage programme settings, delete programmmes, and manage its courses.
		</li>
		<li>
			<b>Programme Editors</b><br />
			Programme Editors are able to manage its courses.
		</li>
	</ul>

	<SuperUserTable
		program={data.program}
		allUsers={data.allUsers}
		editSuperUserForm={data.editSuperUserForm}
		canChangeRoles={hasProgramPermissions(data.user, data.program, 'ProgramAdmin')}
	/>
</section>

<section class="prose mx-auto p-4">
	<h2>Courses</h2>
	<p>
		Courses can be assigned to one or more programmes. Program super users automatically gain admin
		rights to all courses in a programme.
	</p>

	<CoursesTable
		data={data.program?.courses}
		program={data.program}
		{columns}
		courses={data.allCourses}
	/>
</section>

<!-- Only a super admin is able to delete a program -->
{#if hasProgramPermissions(data.user, data.program, 'OnlySuperAdmin')}
	<section
		id="danger-zone"
		class="prose mx-auto my-12 space-y-2 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
	>
		<h2 class="text-red-950">Danger zone</h2>
		<div class="flex items-center gap-2">
			<p class="!my-0">Delete Program</p>
			<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
			<DeleteProgram program={data.program} />
		</div>
	</section>
{/if}
