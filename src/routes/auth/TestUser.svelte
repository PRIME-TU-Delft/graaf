<script lang="ts">
	import { enhance } from '$app/forms';
	import { displayName } from '$lib/utils/displayUserName';
	import type { User } from '@prisma/client';

	let { user }: { user: User } = $props();
</script>

<form action="?/test-user" method="POST" use:enhance>
	<input type="hidden" name="userId" value={user.id} />

	<button type="submit" class="w-full rounded-md bg-purple-50 p-4 text-left hover:bg-purple-100">
		Log in as {displayName(user)}
	</button>
</form>
