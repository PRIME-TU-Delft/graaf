<script lang="ts">
	import type { Program, User } from '@prisma/client';

	type AddNewUserProps = {
		program: Program & { admins: User[]; editors: User[] };
	};

	const { program }: AddNewUserProps = $props();
</script>
