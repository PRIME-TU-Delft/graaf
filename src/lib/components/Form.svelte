
<script lang="ts">

    import { enhance } from '$app/forms';

    export let action: string = '';

</script>

<form method="POST" action={action} use:enhance>
	<slot />
</form>

<style lang="sass">

	form
		display: flex
		flex-flow: column nowrap
		gap: 0.5em

		width: 100%

</style>