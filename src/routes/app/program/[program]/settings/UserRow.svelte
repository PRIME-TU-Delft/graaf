

<script lang="ts">

	// Internal dependencies
	import type { UserController } from '$scripts/controllers'

	
	interface Props {
		// Exports
		user: UserController;
	}

	let { user }: Props = $props();

</script>