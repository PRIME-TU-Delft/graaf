<script lang="ts">
	import { page } from '$app/state';
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { hasCoursePermissions, hasProgramPermissions } from '$lib/utils/permissions';
	import ArchiveCourse from './ArchiveCourse.svelte';
	import EditCourseName from './EditCourseName.svelte';
	import GraphTable from '$lib/components/graphSettings/GraphTable.svelte';
	import DeleteCourse from './DeleteCourse.svelte';
	import SuperUserTable from './superUsers/SuperUserTable.svelte';

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
	<h1 class="!m-0">{data.course.name}</h1>

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

<section class="prose mx-auto p-4">
	<h2>Super Users</h2>
	<p>Super Users are the admins and editors of a course.</p>
	<ul class="text-sm">
		<li>
			<b>Course Admins</b><br />
			Course Admins are able to manage course settings, permanently delete graphs and links, and archive
			the course.
		</li>
		<li>
			<b>Course Editors</b><br />
			Course Editors are able to create and edit graphs and links, but not delete them.
		</li>
		<li>
			<b>Program Admins & Editors</b><br />
			Program Admins and Editors implicitly have admin permissions for all courses in their program.
		</li>
	</ul>

	<SuperUserTable
		course={data.course}
		canChangeRoles={hasCoursePermissions(data.user, data.course, 'CourseAdminORProgramAdminEditor')}
	/>
</section>

<section class="prose mx-auto p-4">
	<h2>Graphs</h2>
	<p>
		Graphs are the bread and butter of the Graph Editor! Here you can structure the information in
		your course using domains, subects, and lectures. Use <b>links</b> or <b>embeds</b> to share graphs
		with your students or friends.
	</p>

	<GraphTable
		graphs={data.course.graphs}
		editGraphForm={data.editGraphForm}
		newLinkForm={data.newLinkForm}
		editLinkForm={data.editLinkForm}
		getLinkURL={(link) => `${page.url.origin}/graph/${data.course.code}/${link.name}`}
		hasAtLeastAdminPermission={hasCoursePermissions(
			data.user,
			data.course,
			'CourseAdminORProgramAdminEditor'
		)}
	/>
</section>

<section class="prose mx-auto p-4">
	<h2>Programs</h2>
	<p>
		This course is part of {data.course.programs.length} program{data.course.programs.length == 1
			? ''
			: 's'}, {programsYouCanEdit.length}
		of which you have permissions for.
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

<!-- Only a program admin or super admin is able to archive/de-archive a  -->
{#if hasCoursePermissions(data.user, data.course, 'CourseAdminORProgramAdminEditor')}
	<section
		id="danger-zone"
		class="prose mx-auto my-12 space-y-2 border-y-2 border-red-700/50 bg-red-100/50 p-4 text-red-900 shadow-red-900/70 sm:rounded-lg sm:border-2 sm:shadow"
	>
		<h2 class="text-red-950">Danger zone</h2>
		<div class="flex items-center gap-2">
			<p class="!my-0">
				{#if data.course.isArchived}
					Restore Course
				{:else}
					Archive Course
				{/if}
			</p>
			<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
			<ArchiveCourse course={data.course} />
		</div>

		{#if data.course.isArchived && hasProgramPermissions(data.user, data.course.programs[0], 'ProgramAdminEditor')}
			<div class="flex items-center gap-2">
				<p class="!my-0">Delete Course</p>
				<div class="mx-2 flex-grow border-t-2 border-dotted border-red-400"></div>
				<DeleteCourse course={data.course} />
			</div>
		{/if}
	</section>
{/if}
