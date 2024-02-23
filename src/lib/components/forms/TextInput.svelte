
<!-- Script -->

<script lang="ts">

    import Row from '$components/forms/Row.svelte'

    export let label: string;
    export let placeholder: string = "";
    export let obfuscate: boolean = false;

</script>

<!-- Markup -->

<Row>
    <label for={label} slot="left">{label}</label>
    <input id={label} slot="right" type={obfuscate ? "password" : "text"} placeholder={placeholder} />
</Row>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    label
        display: block
        padding: calc(0.375rem + 1px) calc(0.75rem + 16px)
        text-align: right

    input
        width: 100%
        padding: 0.375rem 0.75rem

        border: 1px solid variables.$gray
        border-radius: .25rem

        color: variables.$dark-gray
        transition: all 0.15s ease-in-out

        &:hover
            cursor: text

</style>
