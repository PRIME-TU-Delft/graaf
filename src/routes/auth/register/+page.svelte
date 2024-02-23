
<!-- Script -->

<script lang="ts">
    
    import Card from '$components/Card.svelte';
    import Form from '$components/forms/Form.svelte';
	import Row from '$components/forms/Row.svelte';
	import Textfield from '$components/forms/TextInput.svelte';

    function register(event: Event) {
        // TODO add register event
    }

</script>

<!-- Markup -->

<div class="register-form">
    <Card>
        <h1 slot="header">Register</h1>
        <div slot="body">
            <Form>
                <Textfield label="First name" />
                <Textfield label="Last name" />
                <Textfield label="Username" />
                <Textfield label="Password" obfuscate={true} />
                <Textfield label="Confirm password" obfuscate={true} />
                <Row><button slot="right" type="submit" on:click={register}>Register</button></Row>
            </Form>
        </div>
    </Card>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    .register-form
        max-width: 45rem
        margin: 0 auto
    
        button
            padding: 0.375rem 0.75rem
    
            border: 1px solid transparent
            border-radius: 0.25rem
            
            color: white
            background-color: variables.$blue
            transition: all 0.15s ease-in-out

            &:hover
                cursor: pointer
                background-color: variables.$dark-blue
</style>
