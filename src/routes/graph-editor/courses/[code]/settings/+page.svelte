<script lang="ts">
	import DialogButton from '$lib/components/DialogButton.svelte';
	import { hasCoursePermissions } from '$lib/utils/permissions';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let editProgramDialogOpen = $state(false);
</script>

<section
	class="prose top-20 z-10 mx-auto mb-4 flex w-full items-center justify-between rounded-lg bg-blue-50/80 p-4 shadow-none shadow-blue-200/70 backdrop-blur sm:sticky sm:border sm:border-blue-200 sm:shadow-lg"
>
	<h1 class="m-0">{data.course.name}</h1>

	{#if hasCoursePermissions(data.user, data.course, 'CourseAdminORProgramAdminEditor')}
		<DialogButton
			bind:open={editProgramDialogOpen}
			button="Edit course name"
			icon="edit"
			title="Edit the name of the course"
		>
			Edit course name
			<!-- <EditCourseName
				program={data.program}
				editProgramForm={data.editProgramForm}
				onSuccess={() => {
					editProgramDialogOpen = false;
				}}
			/> -->
		</DialogButton>
	{/if}
</section>
