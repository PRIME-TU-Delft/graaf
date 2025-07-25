<script lang="ts">
	import type { PageData } from './$types';
	import UserTable from './users-table/UserTable.svelte';
	import { columns } from './users-table/userTableColumns';

	let { data }: { data: PageData } = $props();
</script>

<section class="prose mx-auto mt-12 max-w-[126ch] p-4 text-purple-900">
	<h1>All Users</h1>
	<p>Here you can find and manage all users</p>

	<UserTable data={data.users} {columns} />
</section>
