<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { hasCoursePermissions, hasProgramPermissions } from '$lib/utils/permissions';
	import ArchiveCourse from './ArchiveCourse.svelte';
	import EditCourseName from './EditCourseName.svelte';
	import GraphLinks from './graphLinks/GraphLinks.svelte';
	import CourseAdmins from './superUsers/CourseAdmins.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editCourseDialogOpen = $state(false);

	let programsYouCanEdit = data.course.programs.filter((program) =>
		hasProgramPermissions(data.user, program, 'ProgramAdminEditor')
	);
</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-purple-50/80 p-4 shadow-none shadow-purple-200/70 backdrop-blur sm:sticky sm:border sm:border-purple-200 sm:shadow-lg"
>
	<h1 class="m-0">{data.course.name}</h1>

	{#if hasCoursePermissions(data.user, data.course, 'CourseAdminORProgramAdminEditor')}
		<DialogButton
			bind:open={editCourseDialogOpen}
			button="Edit course name"
			icon="edit"
			title="Edit the name of the course"
		>
			<EditCourseName
				course={data.course}
				editCourseForm={data.editCourseForm}
				onSuccess={() => {
					editCourseDialogOpen = false;
				}}
			/>
		</DialogButton>
	{/if}
</section>

<CourseAdmins course={data.course} user={data.user} />

{#if hasCoursePermissions(data.user, data.course, 'ProgramAdminEditor')}
	<section class="prose mx-auto p-4">
		<h2>Linked programs</h2>
		<p>
			This course is linked to {data.course.programs.length} program(s), {programsYouCanEdit.length}
			you are allowed to edit.
		</p>
		<ul>
			{#each data.course.programs as program (program.id)}
				<li>
					{#if hasProgramPermissions(data.user, program, 'ProgramAdminEditor')}
						<a href={`/graph-editor/programs/${program.id}/settings`}>{program.name}</a>
					{:else}
						<p>{program.name}</p>
					{/if}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<GraphLinks course={data.course} graphs={data.course.graphs} />

<!-- Only a program admin or super admin is able to archive/de-archive a  -->
{#if hasCoursePermissions(data.user, data.course, 'CourseAdminORProgramAdminEditor')}
	<section
		id="archive-course"
		class="prose mx-auto my-12 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
	>
		<h2 class="text-red-950">Danger zone</h2>
		<div class="flex items-center gap-2">
			<p>Archive program:</p>

			<ArchiveCourse course={data.course} />
		</div>
	</section>
{/if}
