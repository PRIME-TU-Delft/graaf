
<!-- Script -->

<script lang="ts">

    import Row from '$components/forms/Row.svelte'

    export let label: string;
    export let default_value: boolean = false;

</script>

<!-- Markup -->

<Row>
    <div slot="right">
        <input id="checkbox" type="checkbox" value={default_value} />
        <label for="checkbox">{label}</label>
    </div>
</Row>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    input
        accent-color: variables.$blue

        &:hover
            accent-color: variables.$dark-blue
            cursor: pointer

</style>
