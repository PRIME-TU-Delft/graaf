
<script lang="ts">

    import { enhance } from '$app/forms';

    import Textfield from "./form/Textfield.svelte";
    import Button from "./form/Button.svelte";
    import Checkbox from './form/Checkbox.svelte';

    export let action: string = '';

</script>

<form method="POST" action={action} use:enhance>
	<slot {Textfield} {Button} {Checkbox} />
</form>

<style lang="sass">

	form
		display: flex
		flex-flow: column nowrap
		gap: 0.5em

		width: 100%

</style>