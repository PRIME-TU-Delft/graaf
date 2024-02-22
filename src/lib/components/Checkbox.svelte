
<!-- Script -->

<script lang="ts">

    import Row from '$components/Row.svelte'

    export let label: string;
    export let defaultValue: boolean = false;

</script>

<!-- Markup -->

<Row>
    <div slot="right">
        <input id="checkbox" type="checkbox" value={defaultValue} />
        <label for="checkbox">{label}</label>
    </div>
</Row>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    input
        margin: 0
        accent-color: variables.$blue

        &:hover
            cursor: pointer

</style>
