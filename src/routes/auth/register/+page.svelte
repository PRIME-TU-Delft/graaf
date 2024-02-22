
<!-- Script -->

<script lang="ts">
    
    import Card from '$components/Card.svelte';
    import Form from '$components/forms/Form.svelte';
	import Row from '$components/forms/Row.svelte';
	import Textfield from '$components/forms/TextInput.svelte';

</script>

<!-- Markup -->

<div id="register-form">
    <Card>
        <h1 slot="header">Register</h1>
        <div slot="body">
            <Form>
                <Textfield label="First name" />
                <Textfield label="Last name" />
                <Textfield label="Username" />
                <Textfield label="Password" obfuscate={true} />
                <Textfield label="Confirm password" obfuscate={true} />
                <Row><button slot="right" class="btn-blue" type="submit">Register</button></Row>
            </Form>
        </div>
    </Card>
</div>

<!-- Styles -->

<style lang="sass">
    
    @use "$styles/variables.sass"

    #register-form
        max-width: 45rem
        margin: 0 auto
    
    h1
        font-size: inherit
        font-weight: inherit

</style>
