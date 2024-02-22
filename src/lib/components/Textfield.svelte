
<!-- Script -->

<script lang="ts">

    import Row from '$components/Row.svelte'

    export let label: string;
    export let obfuscate: boolean = false;

</script>

<!-- Markup -->

<Row>
    <label for="textfield" slot="left">{label}</label>
    <input id="textfield" slot="right" type={obfuscate ? "password" : "text"} />
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

        border: 1px solid rgba(0, 0, 0, .125)
        border-radius: .25rem

        line-height: 1.5
        font-size: 1rem
        font-family: inherit
        color: variables.$secondary

        transition: all 0.15s ease-in-out

</style>
